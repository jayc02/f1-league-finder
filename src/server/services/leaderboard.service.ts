import { prisma } from '@/lib/db/prisma';

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
