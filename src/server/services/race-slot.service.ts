import {
  EventVisibility,
  OrganiserProfileMemberRole,
  OrganiserProfileMemberStatus,
  RaceSlotStatus,
  Role,
  type Prisma,
  type User,
} from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { withPerf } from '@/lib/utils/perf';

const publicListableRaceStatuses = [RaceSlotStatus.OPEN, RaceSlotStatus.FULL, RaceSlotStatus.LOCKED] as const;
const communityStaffRoles = [OrganiserProfileMemberRole.OWNER, OrganiserProfileMemberRole.ADMIN, OrganiserProfileMemberRole.MODERATOR] as const;

type Viewer = Pick<User, 'id' | 'role'> | null;

const raceSlotSummarySelect = {
  id: true,
  title: true,
  track: true,
  eventNotes: true,
  visibility: true,
  leagueId: true,
  organiserId: true,
  organiserProfileId: true,
  scheduledAt: true,
  region: true,
  game: true,
  platform: true,
  crossplay: true,
  formatDetails: true,
  lobbySettings: true,
  maxPlayers: true,
  status: true,
  registrationCutoffAt: true,
  rulesSummary: true,
  eventTierLabel: true,
  cancellationReason: true,
  createdAt: true,
  updatedAt: true,
  league: { select: { id: true, name: true, slug: true } },
  organiser: { select: { id: true, username: true } },
  organiserProfile: { select: { id: true, slug: true, displayName: true, logoUrl: true } },
  _count: { select: { registrations: true } },
} satisfies Prisma.RaceSlotSelect;

const raceSlotDetailInclude = {
  league: { select: { id: true, name: true, slug: true, ownerId: true } },
  organiser: { select: { id: true, username: true } },
  organiserProfile: { select: { id: true, userId: true, slug: true, displayName: true, logoUrl: true } },
  registrations: {
    select: {
      id: true,
      user: { select: { id: true, username: true, avatarUrl: true, skillRating: true, honourScore: true } },
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  },
  _count: { select: { registrations: true } },
  result: {
    include: {
      entries: {
        orderBy: { finishingPosition: 'asc' },
        include: { user: { select: { id: true, username: true } } },
      },
    },
  },
} satisfies Prisma.RaceSlotInclude;

export type PublicRaceSlotSummary = Prisma.RaceSlotGetPayload<{ select: typeof raceSlotSummarySelect }>;
export type RaceSlotDetailForViewer = Prisma.RaceSlotGetPayload<{ include: typeof raceSlotDetailInclude }>;

export const getPublicUpcomingRaceSlotWhere = () =>
  ({
    visibility: EventVisibility.PUBLIC,
    status: { in: [...publicListableRaceStatuses] },
    scheduledAt: { gte: new Date() },
  }) satisfies Prisma.RaceSlotWhereInput;

export interface PublicRaceSlotSummaryOptions {
  limit?: number;
  status?: string | null;
  leagueId?: string | null;
  organiserSlug?: string | null;
}

export const getPublicRaceSlotSummaries = async ({ limit = 30, status, leagueId, organiserSlug }: PublicRaceSlotSummaryOptions = {}) => {
  const statusFilter = publicListableRaceStatuses.find((publicStatus) => publicStatus === status);

  return prisma.raceSlot.findMany({
    where: {
      ...getPublicUpcomingRaceSlotWhere(),
      ...(status ? { status: statusFilter ?? { in: [] } } : {}),
      ...(leagueId ? { leagueId } : {}),
      ...(organiserSlug ? { organiserProfile: { slug: organiserSlug } } : {}),
    },
    select: raceSlotSummarySelect,
    orderBy: { scheduledAt: 'asc' },
    take: limit,
  });
};

const getViewerCommunityAccess = async (viewer: Viewer, organiserProfileId: string | null, communityOwnerId?: string | null) => {
  if (!viewer) return { isActiveMember: false, isStaffOrOwner: false, isPlatformAdmin: false };
  if (viewer.role === Role.ADMIN) return { isActiveMember: true, isStaffOrOwner: true, isPlatformAdmin: true };

  const isCommunityOwner = Boolean(communityOwnerId && communityOwnerId === viewer.id);
  if (!organiserProfileId) return { isActiveMember: false, isStaffOrOwner: isCommunityOwner, isPlatformAdmin: false };

  const membership = await withPerf('raceSlot.communityAccess', () => prisma.organiserProfileMember.findUnique({
    where: { organiserProfileId_userId: { organiserProfileId, userId: viewer.id } },
    select: { role: true, status: true },
  }));
  const isActiveMember = membership?.status === OrganiserProfileMemberStatus.ACTIVE;
  const isStaffOrOwner = isCommunityOwner || Boolean(isActiveMember && communityStaffRoles.includes(membership.role as never));

  return { isActiveMember, isStaffOrOwner, isPlatformAdmin: false };
};

export const toRaceSlotDetailPayload = (raceSlot: RaceSlotDetailForViewer) => {
  const { league, organiserProfile, ...rest } = raceSlot;

  return {
    ...rest,
    league: { id: league.id, name: league.name, slug: league.slug },
    organiserProfile: organiserProfile
      ? { id: organiserProfile.id, slug: organiserProfile.slug, displayName: organiserProfile.displayName, logoUrl: organiserProfile.logoUrl }
      : null,
  };
};

export type RaceSlotDetailAccessResult =
  | { status: 'ok'; raceSlot: RaceSlotDetailForViewer }
  | { status: 'not_found' }
  | { status: 'access_denied'; message: string };

export const getRaceSlotDetailForViewer = async ({ raceSlotId, viewerUserId }: { raceSlotId: string; viewerUserId?: string | null }): Promise<RaceSlotDetailAccessResult> => {
  const viewer = viewerUserId
    ? await withPerf('raceSlot.viewer', () => prisma.user.findUnique({ where: { id: viewerUserId }, select: { id: true, role: true } }))
    : null;

  const raceSlot = await withPerf('raceSlot.query', () => prisma.raceSlot.findUnique({
    where: { id: raceSlotId },
    include: raceSlotDetailInclude,
  }));

  if (!raceSlot) return { status: 'not_found' };

  const access = await getViewerCommunityAccess(viewer, raceSlot.organiserProfileId, raceSlot.organiserProfile?.userId ?? null);
  const isOwnerOrPrivileged = Boolean(
    viewer &&
      (access.isPlatformAdmin ||
        access.isStaffOrOwner ||
        viewer.id === raceSlot.organiserId ||
        viewer.id === raceSlot.league.ownerId),
  );

  if (raceSlot.visibility === EventVisibility.PUBLIC) return { status: 'ok', raceSlot };

  if (raceSlot.visibility === EventVisibility.COMMUNITY_ONLY) {
    if (access.isActiveMember || isOwnerOrPrivileged) return { status: 'ok', raceSlot };
    return { status: 'access_denied', message: 'This race is only visible to active community members.' };
  }

  if (raceSlot.visibility === EventVisibility.PRIVATE) {
    if (isOwnerOrPrivileged) return { status: 'ok', raceSlot };
    return { status: 'access_denied', message: 'This race is private.' };
  }

  if (raceSlot.visibility === EventVisibility.UNLISTED && raceSlot.status === RaceSlotStatus.DRAFT && !isOwnerOrPrivileged) {
    return { status: 'access_denied', message: 'This unlisted race is not published yet.' };
  }

  return { status: 'ok', raceSlot };
};
