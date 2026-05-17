import { randomInt } from 'node:crypto';
import { DuelStatus, DuelVisibility, HonourEventType, OrganiserProfileMemberStatus, Role, type Prisma, type User } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { HttpError } from '@/lib/utils/http';
import { withPerf } from '@/lib/utils/perf';
import { applyHonourEvent } from '@/server/services/honour.service';

const duelUserSelect = {
  id: true,
  username: true,
  avatarUrl: true,
  preferredPlatform: true,
  skillRating: true,
  honourScore: true,
} as const;

export const duelListSelect = {
  id: true,
  status: true,
  visibility: true,
  ranked: true,
  game: true,
  track: true,
  platform: true,
  crossplay: true,
  raceLength: true,
  weather: true,
  scheduledAt: true,
  createdAt: true,
  createdBy: { select: duelUserSelect },
  opponent: { select: duelUserSelect },
  community: { select: { id: true, slug: true, displayName: true, logoUrl: true } },
} satisfies Prisma.DuelSelect;

export const duelDetailInclude = {
  createdBy: { select: duelUserSelect },
  opponent: { select: duelUserSelect },
  community: { select: { id: true, userId: true, slug: true, displayName: true, logoUrl: true } },
  legs: { orderBy: { legNumber: 'asc' as const } },
  confirmations: { include: { user: { select: duelUserSelect } }, orderBy: { confirmedAt: 'asc' as const } },
} satisfies Prisma.DuelInclude;

type CommunityLike = { id: string; userId: string | null };

export const isActiveCommunityMember = async (userId: string, communityId: string) => {
  const community = await prisma.organiserProfile.findUnique({ where: { id: communityId }, select: { userId: true } });
  if (!community) return false;
  if (community.userId === userId) return true;
  const membership = await prisma.organiserProfileMember.findUnique({
    where: { organiserProfileId_userId: { organiserProfileId: communityId, userId } },
    select: { status: true },
  });
  return membership?.status === OrganiserProfileMemberStatus.ACTIVE;
};

export const canCreateCommunityDuel = async (user: Pick<User, 'id' | 'role'>, community: CommunityLike) => {
  if (user.role === Role.ADMIN || community.userId === user.id) return true;
  const membership = await prisma.organiserProfileMember.findUnique({
    where: { organiserProfileId_userId: { organiserProfileId: community.id, userId: user.id } },
    select: { status: true, role: true },
  });
  return membership?.status === OrganiserProfileMemberStatus.ACTIVE && ['OWNER', 'ADMIN', 'MODERATOR'].includes(membership.role);
};

export const getManagedDuelCommunities = async (user: Pick<User, 'id' | 'role'>) => {
  if (user.role === Role.ADMIN) {
    return prisma.organiserProfile.findMany({ select: { id: true, slug: true, displayName: true }, orderBy: { displayName: 'asc' }, take: 50 });
  }
  const [owned, staffed] = await Promise.all([
    prisma.organiserProfile.findMany({ where: { userId: user.id }, select: { id: true, slug: true, displayName: true } }),
    prisma.organiserProfileMember.findMany({
      where: { userId: user.id, status: 'ACTIVE', role: { in: ['OWNER', 'ADMIN', 'MODERATOR'] } },
      select: { organiserProfile: { select: { id: true, slug: true, displayName: true } } },
    }),
  ]);
  const map = new Map(owned.map((community) => [community.id, community]));
  staffed.forEach((membership) => map.set(membership.organiserProfile.id, membership.organiserProfile));
  return [...map.values()].sort((a, b) => a.displayName.localeCompare(b.displayName));
};

export const getPublicDuels = async (filters: { limit?: number; track?: string; game?: string; platform?: 'PC' | 'PLAYSTATION' | 'XBOX'; ranked?: boolean; openOnly?: boolean }) =>
  withPerf('duels.publicList', () => prisma.duel.findMany({
    where: {
      visibility: DuelVisibility.PUBLIC,
      status: filters.openOnly ? DuelStatus.OPEN : { in: [DuelStatus.OPEN, DuelStatus.ACCEPTED, DuelStatus.IN_PROGRESS, DuelStatus.COMPLETED] },
      ...(filters.track ? { track: filters.track } : {}),
      ...(filters.game ? { game: filters.game } : {}),
      ...(filters.platform ? { platform: filters.platform } : {}),
      ...(typeof filters.ranked === 'boolean' ? { ranked: filters.ranked } : {}),
    },
    select: duelListSelect,
    orderBy: [{ status: 'asc' }, { scheduledAt: 'asc' }, { createdAt: 'desc' }],
    take: filters.limit ?? 30,
  }));

export const getDuelForViewer = async (duelId: string, viewerUserId?: string | null) => {
  const duel = await prisma.duel.findUnique({ where: { id: duelId }, include: duelDetailInclude });
  if (!duel) return { status: 'not_found' as const };
  if (duel.visibility === DuelVisibility.PUBLIC) return { status: 'ok' as const, duel };
  if (!viewerUserId) return { status: 'access_denied' as const, message: 'Sign in to view this duel.' };
  const isParticipant = duel.createdById === viewerUserId || duel.opponentId === viewerUserId;
  if (isParticipant || viewerUserId === duel.community?.userId) return { status: 'ok' as const, duel };
  if (duel.visibility === DuelVisibility.COMMUNITY_ONLY && duel.communityId && await isActiveCommunityMember(viewerUserId, duel.communityId)) {
    return { status: 'ok' as const, duel };
  }
  return { status: 'access_denied' as const, message: 'This duel is private or community-only.' };
};

export const generateDuelCoinFlip = (createdById: string, opponentId: string) => {
  let value = randomInt(0, 101);
  if (value === 50) value = randomInt(0, 2) === 0 ? 49 : 51;
  const winnerUserId = value < 50 ? createdById : opponentId;
  const otherUserId = winnerUserId === createdById ? opponentId : createdById;
  return { value, winnerUserId, leg1AdvantageUserId: winnerUserId, leg2AdvantageUserId: otherUserId };
};

export const acceptDuel = async (duelId: string, user: Pick<User, 'id'>) => {
  const duel = await prisma.duel.findUnique({ where: { id: duelId }, select: { id: true, createdById: true, opponentId: true, communityId: true, visibility: true, status: true, coinFlipValue: true } });
  if (!duel) throw new HttpError(404, 'Duel not found.');
  if (duel.status !== DuelStatus.OPEN) throw new HttpError(409, 'This duel is no longer open.');
  if (duel.createdById === user.id) throw new HttpError(403, 'You cannot accept your own duel.');
  if (duel.opponentId && duel.opponentId !== user.id) throw new HttpError(403, 'This duel is reserved for another driver.');
  if (duel.visibility === DuelVisibility.COMMUNITY_ONLY && duel.communityId && !(await isActiveCommunityMember(user.id, duel.communityId))) {
    throw new HttpError(403, 'Join this community before accepting its duel.');
  }
  const flip = generateDuelCoinFlip(duel.createdById, user.id);
  return prisma.$transaction(async (tx) => {
    const updated = await tx.duel.update({
      where: { id: duel.id },
      data: {
        opponentId: user.id,
        status: DuelStatus.ACCEPTED,
        coinFlipValue: flip.value,
        coinFlipWinnerUserId: flip.winnerUserId,
        leg1AdvantageUserId: flip.leg1AdvantageUserId,
        leg2AdvantageUserId: flip.leg2AdvantageUserId,
        legs: {
          create: [
            { legNumber: 1, advantageUserId: flip.leg1AdvantageUserId },
            { legNumber: 2, advantageUserId: flip.leg2AdvantageUserId },
          ],
        },
      },
      include: duelDetailInclude,
    });
    return updated;
  });
};

const applyRankedDuelOutcome = async (tx: Prisma.TransactionClient, duel: { id: string; ranked: boolean; createdById: string; opponentId: string | null }, winnerUserId: string) => {
  if (!duel.ranked || !duel.opponentId) return;
  const loserUserId = winnerUserId === duel.createdById ? duel.opponentId : duel.createdById;
  const ratingDelta = 16;
  await tx.user.update({ where: { id: winnerUserId }, data: { skillRating: { increment: ratingDelta } } });
  await tx.user.update({ where: { id: loserUserId }, data: { skillRating: { decrement: ratingDelta } } });
  await applyHonourEvent(tx, {
    userId: winnerUserId,
    delta: 1,
    reason: 'Clean confirmed ranked duel result.',
    type: HonourEventType.CLEAN_RACE,
    metadata: { duelId: duel.id, duelType: '1v1' },
  });
  await applyHonourEvent(tx, {
    userId: loserUserId,
    delta: 1,
    reason: 'Clean confirmed ranked duel result.',
    type: HonourEventType.CLEAN_RACE,
    metadata: { duelId: duel.id, duelType: '1v1' },
  });
};

export const submitDuelConfirmation = async (duelId: string, user: Pick<User, 'id'>, input: { winnerUserId: string; leg1WinnerUserId?: string; leg2WinnerUserId?: string; playerATotalTimeMs?: number; playerBTotalTimeMs?: number; evidenceUrl?: string; notes?: string }) => {
  return prisma.$transaction(async (tx) => {
    const duel = await tx.duel.findUnique({ where: { id: duelId }, include: { confirmations: true, legs: true } });
    if (!duel) throw new HttpError(404, 'Duel not found.');
    if (!duel.opponentId || ![duel.createdById, duel.opponentId].includes(user.id)) throw new HttpError(403, 'Only duel drivers can submit results.');
    if (![DuelStatus.ACCEPTED, DuelStatus.IN_PROGRESS, DuelStatus.AWAITING_CONFIRMATION, DuelStatus.DISPUTED].includes(duel.status)) {
      throw new HttpError(409, 'This duel is not accepting result confirmations.');
    }
    const validDriverIds = [duel.createdById, duel.opponentId];
    if (!validDriverIds.includes(input.winnerUserId)) throw new HttpError(400, 'Winner must be one of the two duel drivers.');

    await tx.duelConfirmation.upsert({
      where: { duelId_userId: { duelId, userId: user.id } },
      create: { duelId, userId: user.id, confirmedWinnerId: input.winnerUserId, leg1WinnerId: input.leg1WinnerUserId, leg2WinnerId: input.leg2WinnerUserId, playerATotalTimeMs: input.playerATotalTimeMs, playerBTotalTimeMs: input.playerBTotalTimeMs, evidenceUrl: input.evidenceUrl, notes: input.notes },
      update: { confirmedWinnerId: input.winnerUserId, leg1WinnerId: input.leg1WinnerUserId, leg2WinnerId: input.leg2WinnerUserId, playerATotalTimeMs: input.playerATotalTimeMs, playerBTotalTimeMs: input.playerBTotalTimeMs, evidenceUrl: input.evidenceUrl, notes: input.notes, confirmedAt: new Date() },
    });

    const confirmations = await tx.duelConfirmation.findMany({ where: { duelId } });
    let nextStatus: DuelStatus = DuelStatus.AWAITING_CONFIRMATION;
    if (confirmations.length >= 2) {
      const winners = new Set(confirmations.map((confirmation) => confirmation.confirmedWinnerId));
      nextStatus = winners.size === 1 ? DuelStatus.COMPLETED : DuelStatus.DISPUTED;
      if (nextStatus === DuelStatus.COMPLETED && confirmations[0]?.confirmedWinnerId) {
        const confirmedWinnerId = confirmations[0].confirmedWinnerId;
        const leg1WinnerId = confirmations[0].leg1WinnerId ?? confirmedWinnerId;
        const leg2WinnerId = confirmations[0].leg2WinnerId ?? confirmedWinnerId;
        await tx.duelLeg.updateMany({ where: { duelId, legNumber: 1 }, data: { winnerUserId: leg1WinnerId, completedAt: new Date(), evidenceUrl: confirmations[0].evidenceUrl } });
        await tx.duelLeg.updateMany({ where: { duelId, legNumber: 2 }, data: { winnerUserId: leg2WinnerId, completedAt: new Date(), evidenceUrl: confirmations[0].evidenceUrl } });
        await applyRankedDuelOutcome(tx, duel, confirmedWinnerId);
      }
    }
    return tx.duel.update({ where: { id: duelId }, data: { status: nextStatus }, include: duelDetailInclude });
  });
};
