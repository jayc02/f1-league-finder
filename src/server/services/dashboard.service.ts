import { prisma } from '@/lib/db/prisma';
import { getProfileCommunityRankings } from '@/server/services/community-rating.service';
import { withPerf } from '@/lib/utils/perf';

const communitySummarySelect = {
  slug: true,
  displayName: true,
  shortDescription: true,
  logoUrl: true,
  isPublic: true,
  featured: true,
  verified: true,
} as const;

export const getDashboardPageData = async (userId: string) => {
  const now = new Date();
  const [upcomingRegistrations, upcomingEvents, myDuels, organiserProfile, staffMembership, communityRankings] = await Promise.all([
    withPerf('dashboard.registrations', () =>
      prisma.raceRegistration.findMany({
        where: { userId, raceSlot: { scheduledAt: { gte: now } } },
        select: { raceSlot: { select: { id: true, title: true, scheduledAt: true, league: { select: { name: true } } } } },
        orderBy: { raceSlot: { scheduledAt: 'asc' } },
        take: 5,
      }),
    ),
    withPerf('dashboard.summary', () =>
      prisma.raceSlot.findMany({
        where: { scheduledAt: { gte: now }, status: { in: ['OPEN', 'FULL'] }, visibility: 'PUBLIC' },
        select: { id: true, title: true, scheduledAt: true, status: true, league: { select: { name: true } } },
        orderBy: { scheduledAt: 'asc' },
        take: 5,
      }),
    ),
    withPerf('dashboard.duels', () =>
      prisma.duel.findMany({
        where: { OR: [{ createdById: userId }, { opponentId: userId }] },
        select: { id: true, status: true, track: true, game: true, scheduledAt: true, createdBy: { select: { username: true } }, opponent: { select: { username: true } }, confirmations: { where: { userId }, select: { id: true } } },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
    ),
    withPerf('dashboard.community', () =>
      prisma.organiserProfile.findUnique({
        where: { userId },
        select: communitySummarySelect,
      }),
    ),
    withPerf('dashboard.staffMembership', () =>
      prisma.organiserProfileMember.findFirst({
        where: { userId, status: 'ACTIVE', role: { in: ['ADMIN', 'MODERATOR'] } },
        select: { role: true, organiserProfile: { select: communitySummarySelect } },
      }),
    ),
    getProfileCommunityRankings(userId, 4),
  ]);

  return { upcomingRegistrations, upcomingEvents, myDuels, organiserProfile, staffMembership, communityRankings };
};
