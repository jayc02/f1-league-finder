import { randomInt } from 'node:crypto';
import { DuelStatus, DuelTokenPotStatus, DuelVisibility, HonourEventType, ModerationActionType, OrganiserProfileMemberStatus, RaceTokenLedgerType, Role, type Prisma, type User } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { HttpError } from '@/lib/utils/http';
import { withPerf } from '@/lib/utils/perf';
import { applyHonourEvent } from '@/server/services/honour.service';
import { tokenPotRewardsEnabled } from '@/lib/server/race-token-config';

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
  winnerUserId: true,
  resultAppliedAt: true,
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
  winner: { select: duelUserSelect },
  community: { select: { id: true, slug: true, displayName: true, logoUrl: true } },
} satisfies Prisma.DuelSelect;

export const duelDetailInclude = {
  createdBy: { select: duelUserSelect },
  opponent: { select: duelUserSelect },
  winner: { select: duelUserSelect },
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

export const applyRankedDuelOutcome = async (tx: Prisma.TransactionClient, duel: { id: string; ranked: boolean; createdById: string; opponentId: string | null; resultAppliedAt?: Date | null }, winnerUserId: string) => {
  if (!duel.ranked || !duel.opponentId || duel.resultAppliedAt) return;
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

type DuelConfirmationInput = {
  winnerUserId?: string;
  confirmedWinnerId?: string;
  leg1WinnerUserId?: string;
  leg2WinnerUserId?: string;
  playerATotalTimeMs?: number;
  playerBTotalTimeMs?: number;
  evidenceUrl?: string;
  notes?: string;
};

type ConfirmationState = 'waiting' | 'completed' | 'disputed';

const duelResponseSelect = {
  id: true,
  status: true,
  winnerUserId: true,
  resultAppliedAt: true,
} satisfies Prisma.DuelSelect;

const buildConfirmationResponse = async (tx: Prisma.TransactionClient, duelId: string, confirmationState: ConfirmationState, message: string) => {
  const duel = await tx.duel.findUnique({ where: { id: duelId }, select: duelResponseSelect });
  if (!duel) throw new HttpError(404, 'Duel not found.');
  return { duel, confirmationState, message };
};

export const confirmDuelResult = async ({ duelId, userId, confirmedWinnerId, notes, evidenceUrl, leg1WinnerUserId, leg2WinnerUserId, playerATotalTimeMs, playerBTotalTimeMs }: {
  duelId: string;
  userId: string;
  confirmedWinnerId: string;
  notes?: string;
  evidenceUrl?: string;
  leg1WinnerUserId?: string;
  leg2WinnerUserId?: string;
  playerATotalTimeMs?: number;
  playerBTotalTimeMs?: number;
}) => {
  return prisma.$transaction(async (tx) => {
    const duel = await tx.duel.findUnique({
      where: { id: duelId },
      select: {
        id: true,
        createdById: true,
        opponentId: true,
        status: true,
        ranked: true,
        resultAppliedAt: true,
        winnerUserId: true,
        tokenPot: true,
        tokenPotStatus: true,
        tokenPotAwardedAt: true,
      },
    });
    if (!duel) throw new HttpError(404, 'Duel not found.');
    if (!duel.opponentId) throw new HttpError(409, 'This duel does not have an opponent yet.');
    const participantIds = [duel.createdById, duel.opponentId];
    if (!participantIds.includes(userId)) throw new HttpError(403, 'Only duel drivers can submit results.');
    if (!participantIds.includes(confirmedWinnerId)) throw new HttpError(400, 'Winner must be one of the two duel drivers.');
    if (leg1WinnerUserId && !participantIds.includes(leg1WinnerUserId)) throw new HttpError(400, 'Leg 1 winner must be one of the two duel drivers.');
    if (leg2WinnerUserId && !participantIds.includes(leg2WinnerUserId)) throw new HttpError(400, 'Leg 2 winner must be one of the two duel drivers.');

    if ([DuelStatus.CANCELLED, DuelStatus.EXPIRED].includes(duel.status)) {
      throw new HttpError(409, 'This duel is closed and cannot accept result confirmations.');
    }
    if (duel.status === DuelStatus.COMPLETED) {
      return buildConfirmationResponse(tx, duelId, 'completed', 'This duel is already completed.');
    }
    if (duel.status === DuelStatus.DISPUTED) {
      throw new HttpError(409, 'This duel is disputed and must be resolved by a platform admin.');
    }
    if (![DuelStatus.ACCEPTED, DuelStatus.IN_PROGRESS, DuelStatus.AWAITING_CONFIRMATION].includes(duel.status)) {
      throw new HttpError(409, 'This duel is not accepting result confirmations.');
    }

    await tx.duelConfirmation.upsert({
      where: { duelId_userId: { duelId, userId } },
      create: {
        duelId,
        userId,
        confirmedWinnerId,
        leg1WinnerId: leg1WinnerUserId,
        leg2WinnerId: leg2WinnerUserId,
        playerATotalTimeMs,
        playerBTotalTimeMs,
        evidenceUrl,
        notes,
      },
      update: {
        confirmedWinnerId,
        leg1WinnerId: leg1WinnerUserId,
        leg2WinnerId: leg2WinnerUserId,
        playerATotalTimeMs,
        playerBTotalTimeMs,
        evidenceUrl,
        notes,
        confirmedAt: new Date(),
      },
    });

    const confirmations = await tx.duelConfirmation.findMany({
      where: { duelId, userId: { in: participantIds } },
      orderBy: { confirmedAt: 'asc' },
    });

    if (confirmations.length < 2) {
      await tx.duel.update({ where: { id: duelId }, data: { status: DuelStatus.AWAITING_CONFIRMATION } });
      return buildConfirmationResponse(tx, duelId, 'waiting', 'Waiting for the other driver to confirm.');
    }

    const [first, second] = confirmations;
    if (!first.confirmedWinnerId || !second.confirmedWinnerId || first.confirmedWinnerId !== second.confirmedWinnerId) {
      await tx.duel.update({ where: { id: duelId }, data: { status: DuelStatus.DISPUTED, tokenPotStatus: duel.tokenPot > 0 ? DuelTokenPotStatus.DISPUTED : undefined } });
      return buildConfirmationResponse(tx, duelId, 'disputed', 'Confirmations conflict. A platform admin must review this duel.');
    }

    const winningConfirmation = confirmations.find((confirmation) => confirmation.confirmedWinnerId === first.confirmedWinnerId) ?? first;
    const completedAt = new Date();
    await tx.duelLeg.updateMany({
      where: { duelId, legNumber: 1 },
      data: { winnerUserId: winningConfirmation.leg1WinnerId ?? first.confirmedWinnerId, completedAt, evidenceUrl: winningConfirmation.evidenceUrl },
    });
    await tx.duelLeg.updateMany({
      where: { duelId, legNumber: 2 },
      data: { winnerUserId: winningConfirmation.leg2WinnerId ?? first.confirmedWinnerId, completedAt, evidenceUrl: winningConfirmation.evidenceUrl },
    });
    if (duel.ranked && !duel.resultAppliedAt) {
      await applyRankedDuelOutcome(tx, duel, first.confirmedWinnerId);
    }
    await tx.duel.update({
      where: { id: duelId },
      data: {
        status: DuelStatus.COMPLETED,
        winnerUserId: first.confirmedWinnerId,
        ...(duel.ranked && !duel.resultAppliedAt ? { resultAppliedAt: completedAt } : {}),
      },
    });
    if (duel.tokenPotStatus === DuelTokenPotStatus.HOLDING && duel.tokenPot > 0 && !duel.tokenPotAwardedAt && tokenPotRewardsEnabled) {
      await tx.raceTokenBalance.upsert({ where: { userId: first.confirmedWinnerId }, update: { available: { increment: duel.tokenPot }, lifetimeEarned: { increment: duel.tokenPot } }, create: { userId: first.confirmedWinnerId, available: duel.tokenPot, lifetimeEarned: duel.tokenPot } });
      await tx.raceTokenLedger.create({ data: { userId: first.confirmedWinnerId, amount: duel.tokenPot, type: RaceTokenLedgerType.POT_AWARD, reason: 'Duel token pot award', duelId } });
      await tx.duel.update({ where: { id: duelId }, data: { tokenPotStatus: DuelTokenPotStatus.AWARDED, tokenPotWinnerUserId: first.confirmedWinnerId, tokenPotAwardedAt: new Date() } });
    }
    return buildConfirmationResponse(tx, duelId, 'completed', 'Both drivers confirmed the result. Duel completed.');
  });
};

export const submitDuelConfirmation = async (duelId: string, user: Pick<User, 'id'>, input: DuelConfirmationInput) => {
  const confirmedWinnerId = input.confirmedWinnerId ?? input.winnerUserId;
  if (!confirmedWinnerId) throw new HttpError(400, 'Winner is required.');
  return confirmDuelResult({
    duelId,
    userId: user.id,
    confirmedWinnerId,
    notes: input.notes,
    evidenceUrl: input.evidenceUrl,
    leg1WinnerUserId: input.leg1WinnerUserId,
    leg2WinnerUserId: input.leg2WinnerUserId,
    playerATotalTimeMs: input.playerATotalTimeMs,
    playerBTotalTimeMs: input.playerBTotalTimeMs,
  });
};

export const getAdminDuelQueue = async (limit = 50) => prisma.duel.findMany({
  where: {
    OR: [
      { status: DuelStatus.DISPUTED },
      { status: DuelStatus.AWAITING_CONFIRMATION, updatedAt: { lt: new Date(Date.now() - 1000 * 60 * 60 * 24) } },
    ],
  },
  include: {
    createdBy: { select: duelUserSelect },
    opponent: { select: duelUserSelect },
    winner: { select: duelUserSelect },
    community: { select: { id: true, slug: true, displayName: true } },
    confirmations: { include: { user: { select: duelUserSelect } }, orderBy: { confirmedAt: 'asc' } },
    legs: { orderBy: { legNumber: 'asc' } },
  },
  orderBy: [{ status: 'desc' }, { updatedAt: 'asc' }],
  take: limit,
});

export const resolveDuelAsAdmin = async (duelId: string, admin: Pick<User, 'id'>, input: { action: 'COMPLETED' | 'CANCELLED' | 'DISPUTED'; winnerUserId?: string; reason: string }) => {
  return prisma.$transaction(async (tx) => {
    const duel = await tx.duel.findUnique({
      where: { id: duelId },
      include: { confirmations: true },
    });
    if (!duel) throw new HttpError(404, 'Duel not found.');
    if (duel.resultAppliedAt && (input.action !== 'COMPLETED' || input.winnerUserId !== duel.winnerUserId)) {
      throw new HttpError(409, 'This ranked duel result has already been applied and cannot be changed without reversal support.');
    }

    const participantIds = [duel.createdById, duel.opponentId].filter(Boolean) as string[];
    if (input.action === 'COMPLETED') {
      if (!duel.opponentId) throw new HttpError(409, 'Cannot complete a duel without an opponent.');
      if (!input.winnerUserId || !participantIds.includes(input.winnerUserId)) throw new HttpError(400, 'Winner must be one of the two duel drivers.');
    }

    const oldStatus = duel.status;
    const completedAt = new Date();
    const nextStatus = input.action === 'COMPLETED' ? DuelStatus.COMPLETED : input.action === 'CANCELLED' ? DuelStatus.CANCELLED : DuelStatus.DISPUTED;

    if (input.action === 'COMPLETED' && input.winnerUserId && duel.ranked && !duel.resultAppliedAt) {
      await applyRankedDuelOutcome(tx, duel, input.winnerUserId);
    }

    const updated = await tx.duel.update({
      where: { id: duelId },
      data: {
        status: nextStatus,
        winnerUserId: input.action === 'COMPLETED' ? input.winnerUserId : duel.winnerUserId,
        ...(input.action === 'COMPLETED' && duel.ranked && !duel.resultAppliedAt ? { resultAppliedAt: completedAt } : {}),
      },
      include: duelDetailInclude,
    });

    await tx.moderationAction.create({
      data: {
        actionType: ModerationActionType.DISPUTE_RESOLUTION,
        targetUserId: duel.createdById,
        adminId: admin.id,
        notes: input.reason,
        metadata: {
          duelId,
          oldStatus,
          newStatus: nextStatus,
          winnerUserId: input.winnerUserId ?? null,
          reason: input.reason,
          adminId: admin.id,
        },
      },
    });

    return updated;
  });
};
