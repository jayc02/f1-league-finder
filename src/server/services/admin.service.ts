import { prisma } from '@/lib/db/prisma';
import { withPerf } from '@/lib/utils/perf';

export const ADMIN_PAGE_SIZE = 50;
export const ADMIN_PREVIEW_SIZE = 5;

export const getAdminOverview = () =>
  Promise.all([
    withPerf('admin.users.count', () => prisma.user.count()),
    withPerf('admin.races.count', () => prisma.raceSlot.count()),
    withPerf('admin.communities.count', () => prisma.organiserProfile.count()),
    withPerf('admin.disputes.count', () => prisma.dispute.count({ where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } } })),
    withPerf('admin.users.latest', () => prisma.user.findMany({ select: { id: true, username: true, role: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: ADMIN_PREVIEW_SIZE })),
    withPerf('admin.races.latest', () => prisma.raceSlot.findMany({ select: { id: true, title: true, status: true, scheduledAt: true, league: { select: { name: true } } }, orderBy: { createdAt: 'desc' }, take: ADMIN_PREVIEW_SIZE })),
  ]);

export const getAdminUsers = (take = ADMIN_PAGE_SIZE) =>
  withPerf('admin.users', () =>
    prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        region: true,
        honourScore: true,
        skillRating: true,
        suspensionNote: true,
        createdAt: true,
        preferredPlatform: true,
        organiserProfile: { select: { displayName: true, verified: true, isPublic: true, featured: true } },
        _count: { select: { raceRegistrations: true, raceSlotsOrganised: true, disputesOpened: true } },
      },
      orderBy: { createdAt: 'desc' },
      take,
    }),
  );

export const getAdminRaces = (take = ADMIN_PAGE_SIZE) =>
  withPerf('admin.races', () =>
    prisma.raceSlot.findMany({
      select: {
        id: true,
        title: true,
        track: true,
        visibility: true,
        scheduledAt: true,
        status: true,
        maxPlayers: true,
        registrationCutoffAt: true,
        cancellationReason: true,
        league: { select: { name: true } },
        organiser: { select: { username: true } },
        organiserProfile: { select: { displayName: true } },
        _count: { select: { registrations: true, disputes: true, moderationActions: true } },
      },
      orderBy: { scheduledAt: 'desc' },
      take,
    }),
  );

export const getAdminCommunities = (take = ADMIN_PAGE_SIZE) =>
  withPerf('admin.communities', () =>
    prisma.organiserProfile.findMany({
      include: {
        user: { select: { username: true, email: true } },
        _count: { select: { raceSlots: true, leagues: true } },
      },
      orderBy: [{ featured: 'desc' }, { verified: 'desc' }, { updatedAt: 'desc' }],
      take,
    }),
  );

export const getAdminDisputes = (take = ADMIN_PAGE_SIZE) =>
  withPerf('admin.disputes', () =>
    prisma.dispute.findMany({
      include: {
        openedBy: { select: { id: true, username: true, email: true } },
        resolvedBy: { select: { id: true, username: true } },
        raceSlot: {
          select: {
            id: true,
            title: true,
            organiser: { select: { id: true, username: true, email: true } },
            organiserProfile: { select: { id: true, displayName: true } },
            league: { select: { id: true, name: true } },
          },
        },
        _count: { select: { moderationActions: true, emailLogs: true } },
      },
      orderBy: { createdAt: 'desc' },
      take,
    }),
  );
