import { prisma } from '@/lib/db/prisma';

export type CompetitiveLeaderboardType = 'overall' | 'honour' | 'clean' | 'wins' | 'weekly';

interface LeaderboardEntry {
  id: string;
  username: string;
  avatarUrl: string | null;
  region: string;
  honourScore: number;
  skillRating: number;
  racesEntered: number;
  wins: number;
  podiums: number;
  cleanFinishes: number;
  points: number;
  averageFinish: number | null;
  trend: 'up' | 'down' | 'stable';
}

export const getGlobalSkillLeaderboard = (limit: number) =>
  prisma.user.findMany({
    where: { role: { not: 'ADMIN' } },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      region: true,
      skillRating: true,
      honourScore: true,
    },
    orderBy: [{ skillRating: 'desc' }, { honourScore: 'desc' }],
    take: limit,
  });

export const getHonourLeaderboard = (limit: number) =>
  prisma.user.findMany({
    where: { role: { not: 'ADMIN' } },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      region: true,
      honourScore: true,
      skillRating: true,
    },
    orderBy: [{ honourScore: 'desc' }, { skillRating: 'desc' }],
    take: limit,
  });

const applySortForType = (type: CompetitiveLeaderboardType) => {
  if (type === 'honour') return [{ honourScore: 'desc' }, { skillRating: 'desc' }] as const;
  return [{ skillRating: 'desc' }, { honourScore: 'desc' }] as const;
};

export const getCompetitiveLeaderboard = async (type: CompetitiveLeaderboardType, limit: number): Promise<LeaderboardEntry[]> => {
  const candidateLimit = Math.max(limit * 3, 40);
  const userBase = await prisma.user.findMany({
    where: { role: { not: 'ADMIN' } },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      region: true,
      honourScore: true,
      skillRating: true,
    },
    orderBy: applySortForType(type),
    take: candidateLimit,
  });

  const userIds = userBase.map((user) => user.id);
  if (!userIds.length) return [];

  const [registrationsByUser, resultsByUser, cleanByUser, weeklyByUser] = await Promise.all([
    prisma.raceRegistration.groupBy({ by: ['userId'], where: { userId: { in: userIds } }, _count: { userId: true } }),
    prisma.raceResultEntry.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, finishingPosition: true, pointsAwarded: true, raceResult: { select: { submittedAt: true } } },
    }),
    prisma.honourEvent.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds }, type: 'CLEAN_RACE', delta: { gt: 0 } },
      _count: { userId: true },
    }),
    prisma.raceResultEntry.findMany({
      where: {
        userId: { in: userIds },
        raceResult: {
          submittedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      },
      select: { userId: true, pointsAwarded: true, finishingPosition: true },
    }),
  ]);

  const registrationMap = new Map(registrationsByUser.map((entry) => [entry.userId, entry._count.userId]));
  const cleanMap = new Map(cleanByUser.map((entry) => [entry.userId, entry._count.userId]));

  const resultStats = new Map<string, { wins: number; podiums: number; points: number; finishes: number; finishSum: number }>();
  for (const entry of resultsByUser) {
    const current = resultStats.get(entry.userId) ?? { wins: 0, podiums: 0, points: 0, finishes: 0, finishSum: 0 };
    current.wins += entry.finishingPosition === 1 ? 1 : 0;
    current.podiums += entry.finishingPosition <= 3 ? 1 : 0;
    current.points += entry.pointsAwarded;
    current.finishes += 1;
    current.finishSum += entry.finishingPosition;
    resultStats.set(entry.userId, current);
  }

  const weeklyStats = new Map<string, { points: number; finishes: number }>();
  for (const entry of weeklyByUser) {
    const current = weeklyStats.get(entry.userId) ?? { points: 0, finishes: 0 };
    current.points += entry.pointsAwarded;
    current.finishes += 1;
    weeklyStats.set(entry.userId, current);
  }

  const rows = userBase.map((user) => {
    const result = resultStats.get(user.id) ?? { wins: 0, podiums: 0, points: 0, finishes: 0, finishSum: 0 };
    const weekly = weeklyStats.get(user.id) ?? { points: 0, finishes: 0 };
    const avgFinish = result.finishes ? result.finishSum / result.finishes : null;

    const trend: LeaderboardEntry['trend'] = weekly.points > 22 ? 'up' : weekly.finishes ? 'stable' : 'down';

    return {
      ...user,
      racesEntered: registrationMap.get(user.id) ?? 0,
      wins: result.wins,
      podiums: result.podiums,
      cleanFinishes: cleanMap.get(user.id) ?? 0,
      points: result.points,
      averageFinish: avgFinish,
      trend,
      weeklyPoints: weekly.points,
    };
  });

  const sorted = rows.sort((a, b) => {
    if (type === 'honour') return b.honourScore - a.honourScore || b.skillRating - a.skillRating;
    if (type === 'wins') return b.wins - a.wins || b.podiums - a.podiums || b.skillRating - a.skillRating;
    if (type === 'clean') return b.cleanFinishes - a.cleanFinishes || b.honourScore - a.honourScore;
    if (type === 'weekly') return b.weeklyPoints - a.weeklyPoints || b.skillRating - a.skillRating;
    return b.skillRating - a.skillRating || b.points - a.points;
  });

  return sorted.slice(0, limit).map(({ weeklyPoints: _weeklyPoints, ...row }) => row);
};

export const getLeagueStandings = async (leagueSlug: string, limit: number) => {
  const league = await prisma.league.findUnique({
    where: { slug: leagueSlug },
    select: {
      id: true,
      name: true,
      slug: true,
      raceSlots: {
        where: {
          status: 'COMPLETED',
          result: { isNot: null },
        },
        select: {
          id: true,
          result: {
            select: {
              entries: {
                select: {
                  userId: true,
                  pointsAwarded: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!league) return null;

  const aggregate = new Map<string, number>();
  for (const slot of league.raceSlots) {
    for (const entry of slot.result?.entries ?? []) {
      aggregate.set(entry.userId, (aggregate.get(entry.userId) ?? 0) + entry.pointsAwarded);
    }
  }

  const ids = [...aggregate.keys()];
  const users = ids.length
    ? await prisma.user.findMany({
        where: { id: { in: ids } },
        select: { id: true, username: true, avatarUrl: true, skillRating: true, honourScore: true },
      })
    : [];

  const standings = users
    .map((u) => ({ ...u, points: aggregate.get(u.id) ?? 0 }))
    .sort((a, b) => b.points - a.points || b.skillRating - a.skillRating)
    .slice(0, limit);

  return { league: { id: league.id, name: league.name, slug: league.slug }, standings };
};
