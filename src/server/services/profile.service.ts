import { prisma } from '@/lib/db/prisma';
import { withPerf } from '@/lib/utils/perf';
import { getRegionalRanks } from '@/server/services/leaderboard.service';

export const getProfilePageData = async (userId: string) => {
  const now = new Date();

  const [recentResults, upcomingRegistrations, starts, completedRaces, wins, podiums, cleanRaces, ranks, ownedCommunity] = await Promise.all([
    withPerf('profile.results', () =>
      prisma.raceResultEntry.findMany({
        where: { userId },
        select: {
          finishingPosition: true,
          pointsAwarded: true,
          raceResult: { select: { submittedAt: true, raceSlot: { select: { title: true, id: true } } } },
        },
        orderBy: { raceResult: { submittedAt: 'desc' } },
        take: 6,
      }),
    ),
    withPerf('profile.registrations', () =>
      prisma.raceRegistration.findMany({
        where: { userId, raceSlot: { scheduledAt: { gte: now } } },
        select: { raceSlot: { select: { id: true, title: true, scheduledAt: true, league: { select: { name: true } } } } },
        orderBy: { raceSlot: { scheduledAt: 'asc' } },
        take: 5,
      }),
    ),
    withPerf('profile.starts', () => prisma.raceRegistration.count({ where: { userId } })),
    withPerf('profile.completedRaces', () => prisma.raceResultEntry.count({ where: { userId } })),
    withPerf('profile.wins', () => prisma.raceResultEntry.count({ where: { userId, finishingPosition: 1 } })),
    withPerf('profile.podiums', () => prisma.raceResultEntry.count({ where: { userId, finishingPosition: { lte: 3 } } })),
    withPerf('profile.cleanRaces', () => prisma.honourEvent.count({ where: { userId, type: 'CLEAN_RACE', delta: { gt: 0 } } })),
    withPerf('profile.regionalRanks', () => getRegionalRanks(userId)),
    withPerf('profile.community', () => prisma.organiserProfile.findUnique({ where: { userId }, select: { displayName: true, slug: true } })),
  ]);

  return { recentResults, upcomingRegistrations, starts, completedRaces, wins, podiums, cleanRaces, ranks, ownedCommunity };
};
