import { prisma } from '@/lib/db/prisma';

export type CompetitiveLeaderboardType = 'overall' | 'honour' | 'clean' | 'wins' | 'weekly';

export interface LeaderboardEntry {
  id: string;
  rank: number;
  username: string;
  avatarUrl: string | null;
  role: 'PLAYER' | 'ORGANISER' | 'ADMIN';
  createdAt: Date;
  region: string;
  honourScore: number;
  skillRating: number;
  racesEntered: number;
  starts: number;
  wins: number;
  podiums: number;
  cleanFinishes: number;
  cleanRaceRatio: number;
  points: number;
  weeklyPoints: number;
  averageFinish: number | null;
  bestFinish: number | null;
  trend: 'up' | 'down' | 'stable';
}

const buildBaseRows = async () => {
  const users = await prisma.user.findMany({
    where: { role: { not: 'ADMIN' } },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      role: true,
      createdAt: true,
      region: true,
      honourScore: true,
      skillRating: true,
    },
  });

  if (!users.length) return [];

  const userIds = users.map((user) => user.id);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [registrationsByUser, resultsByUser, cleanByUser, weeklyByUser] = await Promise.all([
    prisma.raceRegistration.groupBy({ by: ['userId'], where: { userId: { in: userIds } }, _count: { userId: true } }),
    prisma.raceResultEntry.findMany({
      where: { userId: { in: userIds } },
      select: {
        userId: true,
        finishingPosition: true,
        pointsAwarded: true,
      },
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
          submittedAt: { gte: sevenDaysAgo },
        },
      },
      select: { userId: true, pointsAwarded: true },
    }),
  ]);

  const registrationMap = new Map(registrationsByUser.map((entry) => [entry.userId, entry._count.userId]));
  const cleanMap = new Map(cleanByUser.map((entry) => [entry.userId, entry._count.userId]));

  const resultStats = new Map<string, { wins: number; podiums: number; points: number; finishes: number; finishSum: number; bestFinish: number | null }>();
  for (const entry of resultsByUser) {
    const current = resultStats.get(entry.userId) ?? { wins: 0, podiums: 0, points: 0, finishes: 0, finishSum: 0, bestFinish: null };
    current.wins += entry.finishingPosition === 1 ? 1 : 0;
    current.podiums += entry.finishingPosition <= 3 ? 1 : 0;
    current.points += entry.pointsAwarded;
    current.finishes += 1;
    current.finishSum += entry.finishingPosition;
    current.bestFinish = current.bestFinish ? Math.min(current.bestFinish, entry.finishingPosition) : entry.finishingPosition;
    resultStats.set(entry.userId, current);
  }

  const weeklyStats = new Map<string, number>();
  for (const entry of weeklyByUser) {
    weeklyStats.set(entry.userId, (weeklyStats.get(entry.userId) ?? 0) + entry.pointsAwarded);
  }

  return users.map((user) => {
    const result = resultStats.get(user.id) ?? { wins: 0, podiums: 0, points: 0, finishes: 0, finishSum: 0, bestFinish: null };
    const weeklyPoints = weeklyStats.get(user.id) ?? 0;
    const cleanFinishes = cleanMap.get(user.id) ?? 0;
    const cleanRaceRatio = result.finishes ? cleanFinishes / result.finishes : 0;

    const trend: LeaderboardEntry['trend'] = weeklyPoints >= 30 ? 'up' : weeklyPoints > 0 ? 'stable' : 'down';

    return {
      ...user,
      racesEntered: registrationMap.get(user.id) ?? 0,
      starts: result.finishes,
      wins: result.wins,
      podiums: result.podiums,
      cleanFinishes,
      cleanRaceRatio,
      points: result.points,
      weeklyPoints,
      averageFinish: result.finishes ? result.finishSum / result.finishes : null,
      bestFinish: result.bestFinish,
      trend,
    };
  });
};

const sortRowsByType = (rows: Awaited<ReturnType<typeof buildBaseRows>>, type: CompetitiveLeaderboardType) => {
  const sorted = [...rows];
  sorted.sort((a, b) => {
    if (type === 'honour') return b.honourScore - a.honourScore || b.cleanRaceRatio - a.cleanRaceRatio || b.skillRating - a.skillRating;
    if (type === 'clean') return b.cleanRaceRatio - a.cleanRaceRatio || b.cleanFinishes - a.cleanFinishes || b.honourScore - a.honourScore;
    if (type === 'wins') return b.wins - a.wins || b.podiums - a.podiums || b.skillRating - a.skillRating;
    if (type === 'weekly') return b.weeklyPoints - a.weeklyPoints || b.skillRating - a.skillRating;
    return b.skillRating - a.skillRating || b.points - a.points || b.honourScore - a.honourScore;
  });

  return sorted.map((row, index) => ({ ...row, rank: index + 1 }));
};

export const getRankedLeaderboard = async (type: CompetitiveLeaderboardType): Promise<LeaderboardEntry[]> => {
  const rows = await buildBaseRows();
  return sortRowsByType(rows, type);
};

export const getCompetitiveLeaderboard = async (type: CompetitiveLeaderboardType, limit: number): Promise<LeaderboardEntry[]> => {
  const ranked = await getRankedLeaderboard(type);
  return ranked.slice(0, limit);
};

export const getLeaderboardWindowForUser = async (
  type: CompetitiveLeaderboardType,
  userId: string,
  radius = 3,
): Promise<{ me: LeaderboardEntry | null; window: LeaderboardEntry[] }> => {
  const ranked = await getRankedLeaderboard(type);
  const index = ranked.findIndex((entry) => entry.id === userId);
  if (index === -1) return { me: null, window: [] };

  return {
    me: ranked[index],
    window: ranked.slice(Math.max(index - radius, 0), index + radius + 1),
  };
};

export const getRegionalRanks = async (userId: string) => {
  const [overall, user] = await Promise.all([
    getRankedLeaderboard('overall'),
    prisma.user.findUnique({ where: { id: userId }, select: { region: true } }),
  ]);

  const global = overall.find((entry) => entry.id === userId)?.rank ?? null;
  const regionalPool = overall.filter((entry) => entry.region === (user?.region ?? 'GLOBAL'));
  const regional = regionalPool.find((entry) => entry.id === userId)?.rank ?? null;

  return {
    global,
    regional,
    region: user?.region ?? 'GLOBAL',
  };
};

export const getGlobalSkillLeaderboard = async (limit: number) => {
  const ranked = await getRankedLeaderboard('overall');
  return ranked.slice(0, limit);
};

export const getHonourLeaderboard = async (limit: number) => {
  const ranked = await getRankedLeaderboard('honour');
  return ranked.slice(0, limit);
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
