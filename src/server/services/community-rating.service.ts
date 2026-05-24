import { Prisma, type PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { withPerf } from '@/lib/utils/perf';

const DEFAULT_COMMUNITY_SKILL = 1000;
const DEFAULT_COMMUNITY_HONOUR = 100;
const MIN_HONOUR = 0;
const MAX_HONOUR = 150;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

type DbClient = PrismaClient | Prisma.TransactionClient;

export type CommunityRankingView = 'sr' | 'honour' | 'clean' | 'movers';

export interface CommunityResultEntryInput {
  userId: string;
  finishingPosition: number;
  ratingDelta?: number;
  honourDelta?: number;
}

export interface ApplyCommunityRaceResultInput {
  organiserProfileId: string;
  raceSlotId: string;
  raceResultId: string;
  appliedById?: string | null;
  entries: CommunityResultEntryInput[];
  reason?: string;
  occurredAt?: Date;
}

export interface SubmitCommunityResultEntry {
  userId: string;
  finishingPosition: number;
  ratingDelta?: number;
  honourDelta?: number;
  notes?: string | null;
}

export interface SubmitCommunityResultInput {
  organiserProfileId: string;
  submittedById: string;
  eventName: string;
  track?: string | null;
  occurredAt: Date | string;
  evidenceUrl?: string | null;
  notes?: string | null;
  entries: SubmitCommunityResultEntry[];
  applyGlobalRating?: boolean;
  allowPlatformAdminBypass?: boolean;
}

export interface SubmitCommunityResultResult {
  result: {
    organiserProfileId: string;
    eventName: string;
    track: string | null;
    occurredAt: Date;
    evidenceUrl: string | null;
    notes: string | null;
    submittedById: string;
    totalDrivers: number;
  };
  ratingEvents: Awaited<ReturnType<Prisma.TransactionClient['communityRatingEvent']['create']>>[];
  updatedRatings: Awaited<ReturnType<Prisma.TransactionClient['communityDriverRating']['update']>>[];
}

export const computeCommunitySkillDelta = (finishingPosition: number, totalDrivers: number) => {
  const midpoint = (totalDrivers + 1) / 2;
  return clamp(Math.round((midpoint - finishingPosition) * 4), -24, 24);
};

export const computeCommunityHonourDelta = (finishingPosition: number, totalDrivers: number) => {
  if (finishingPosition === 1) return 2;
  if (finishingPosition <= Math.ceil(totalDrivers / 2)) return 1;
  return 0;
};

const getRankingOrder = (view: CommunityRankingView): Prisma.CommunityDriverRatingOrderByWithRelationInput[] => {
  if (view === 'honour') return [{ honourScore: 'desc' }, { cleanRaces: 'desc' }, { skillRating: 'desc' }];
  if (view === 'clean') return [{ cleanRaces: 'desc' }, { incidents: 'asc' }, { starts: 'desc' }, { honourScore: 'desc' }];
  return [{ skillRating: 'desc' }, { wins: 'desc' }, { honourScore: 'desc' }];
};

export const ensureCommunityDriverRating = async (
  db: DbClient,
  organiserProfileId: string,
  userId: string,
) =>
  db.communityDriverRating.upsert({
    where: { organiserProfileId_userId: { organiserProfileId, userId } },
    update: {},
    create: { organiserProfileId, userId, skillRating: DEFAULT_COMMUNITY_SKILL, honourScore: DEFAULT_COMMUNITY_HONOUR },
  });

export const applyCommunityRaceResult = async (db: Prisma.TransactionClient, input: ApplyCommunityRaceResultInput) => {
  const totalDrivers = input.entries.length;
  if (!totalDrivers) return [];

  const eventReason = input.reason ?? 'Race result submitted';
  const occurredAt = input.occurredAt ?? new Date();

  const events = [];
  for (const entry of input.entries) {
    const existing = await ensureCommunityDriverRating(db, input.organiserProfileId, entry.userId);
    const skillDelta = entry.ratingDelta ?? computeCommunitySkillDelta(entry.finishingPosition, totalDrivers);
    const honourDelta = entry.honourDelta ?? computeCommunityHonourDelta(entry.finishingPosition, totalDrivers);
    const nextSkill = Math.max(0, existing.skillRating + skillDelta);
    const nextHonour = clamp(existing.honourScore + honourDelta, MIN_HONOUR, MAX_HONOUR);

    await db.communityDriverRating.update({
      where: { id: existing.id },
      data: {
        skillRating: nextSkill,
        honourScore: nextHonour,
        starts: { increment: 1 },
        wins: { increment: entry.finishingPosition === 1 ? 1 : 0 },
        podiums: { increment: entry.finishingPosition <= 3 ? 1 : 0 },
        cleanRaces: { increment: honourDelta > 0 ? 1 : 0 },
        incidents: { increment: honourDelta < 0 ? 1 : 0 },
        lastRaceAt: occurredAt,
      },
    });

    events.push(await db.communityRatingEvent.create({
      data: {
        organiserProfileId: input.organiserProfileId,
        userId: entry.userId,
        raceSlotId: input.raceSlotId,
        raceResultId: input.raceResultId,
        appliedById: input.appliedById ?? null,
        skillDelta,
        honourDelta,
        reason: eventReason,
        metadata: {
          source: 'race_result',
          finishingPosition: entry.finishingPosition,
          totalDrivers,
          before: { skillRating: existing.skillRating, honourScore: existing.honourScore },
          after: { skillRating: nextSkill, honourScore: nextHonour },
        } satisfies Prisma.JsonObject,
      },
    }));
  }

  return events;
};

export const applyCommunityDuelOutcome = async (
  db: Prisma.TransactionClient,
  input: {
    organiserProfileId: string;
    duelId: string;
    winnerUserId: string;
    loserUserId: string;
    appliedById?: string | null;
    reason?: string;
  },
) => {
  const winner = await ensureCommunityDriverRating(db, input.organiserProfileId, input.winnerUserId);
  const loser = await ensureCommunityDriverRating(db, input.organiserProfileId, input.loserUserId);
  const winnerSkill = winner.skillRating + 16;
  const loserSkill = Math.max(0, loser.skillRating - 16);
  const winnerHonour = clamp(winner.honourScore + 1, MIN_HONOUR, MAX_HONOUR);
  const loserHonour = clamp(loser.honourScore + 1, MIN_HONOUR, MAX_HONOUR);
  const now = new Date();
  const reason = input.reason ?? 'Ranked community duel completed';

  await db.communityDriverRating.update({
    where: { id: winner.id },
    data: {
      skillRating: winnerSkill,
      honourScore: winnerHonour,
      starts: { increment: 1 },
      wins: { increment: 1 },
      podiums: { increment: 1 },
      cleanRaces: { increment: 1 },
      lastRaceAt: now,
    },
  });
  await db.communityDriverRating.update({
    where: { id: loser.id },
    data: {
      skillRating: loserSkill,
      honourScore: loserHonour,
      starts: { increment: 1 },
      cleanRaces: { increment: 1 },
      lastRaceAt: now,
    },
  });

  return Promise.all([
    db.communityRatingEvent.create({
      data: {
        organiserProfileId: input.organiserProfileId,
        userId: input.winnerUserId,
        duelId: input.duelId,
        appliedById: input.appliedById ?? null,
        skillDelta: 16,
        honourDelta: 1,
        reason,
        metadata: {
          source: 'duel_result',
          outcome: 'winner',
          before: { skillRating: winner.skillRating, honourScore: winner.honourScore },
          after: { skillRating: winnerSkill, honourScore: winnerHonour },
        } satisfies Prisma.JsonObject,
      },
    }),
    db.communityRatingEvent.create({
      data: {
        organiserProfileId: input.organiserProfileId,
        userId: input.loserUserId,
        duelId: input.duelId,
        appliedById: input.appliedById ?? null,
        skillDelta: -16,
        honourDelta: 1,
        reason,
        metadata: {
          source: 'duel_result',
          outcome: 'loser',
          before: { skillRating: loser.skillRating, honourScore: loser.honourScore },
          after: { skillRating: loserSkill, honourScore: loserHonour },
        } satisfies Prisma.JsonObject,
      },
    }),
  ]);
};

export async function submitCommunityResult(input: SubmitCommunityResultInput): Promise<SubmitCommunityResultResult> {
  const eventName = input.eventName.trim();
  const occurredAt = input.occurredAt instanceof Date ? input.occurredAt : new Date(input.occurredAt);

  if (!eventName) throw new Error('Event name is required.');
  if (Number.isNaN(occurredAt.getTime())) throw new Error('A valid occurredAt date is required.');
  if (!input.entries.length) throw new Error('At least one result entry is required.');

  const uniqueUsers = new Set(input.entries.map((entry) => entry.userId));
  const uniquePositions = new Set(input.entries.map((entry) => entry.finishingPosition));
  if (uniqueUsers.size !== input.entries.length || uniquePositions.size !== input.entries.length) {
    throw new Error('Result entries must have unique users and finishing positions.');
  }

  const ordered = [...input.entries].sort((a, b) => a.finishingPosition - b.finishingPosition);
  if (ordered.some((entry) => !entry.userId || !Number.isInteger(entry.finishingPosition) || entry.finishingPosition < 1)) {
    throw new Error('Each result entry requires a valid user and finishing position.');
  }

  return prisma.$transaction(async (tx) => {
    const community = await tx.organiserProfile.findUnique({
      where: { id: input.organiserProfileId },
      select: { id: true, userId: true },
    });
    if (!community) throw new Error('Community not found.');

    const submitterRole = await tx.organiserProfileMember.findUnique({
      where: { organiserProfileId_userId: { organiserProfileId: input.organiserProfileId, userId: input.submittedById } },
      select: { role: true, status: true },
    });
    const canSubmit =
      input.allowPlatformAdminBypass === true ||
      community.userId === input.submittedById ||
      Boolean(submitterRole?.status === 'ACTIVE' && ['OWNER', 'ADMIN', 'MODERATOR'].includes(submitterRole.role));
    if (!canSubmit) throw new Error('Insufficient community permissions.');

    if (!input.allowPlatformAdminBypass) {
      const activeMemberships = await tx.organiserProfileMember.findMany({
        where: {
          organiserProfileId: input.organiserProfileId,
          userId: { in: ordered.map((entry) => entry.userId) },
          status: 'ACTIVE',
        },
        select: { userId: true },
      });
      const activeUserIds = new Set(activeMemberships.map((membership) => membership.userId));
      if (community.userId) activeUserIds.add(community.userId);
      const missingUser = ordered.find((entry) => !activeUserIds.has(entry.userId));
      if (missingUser) throw new Error(`User ${missingUser.userId} is not an active community member.`);
    }

    const totalDrivers = ordered.length;
    const ratingEvents = [];
    const updatedRatings = [];
    for (const entry of ordered) {
      const existing = await ensureCommunityDriverRating(tx, input.organiserProfileId, entry.userId);
      const skillDelta = entry.ratingDelta ?? computeCommunitySkillDelta(entry.finishingPosition, totalDrivers);
      const honourDelta = entry.honourDelta ?? computeCommunityHonourDelta(entry.finishingPosition, totalDrivers);
      const nextSkill = Math.max(0, existing.skillRating + skillDelta);
      const nextHonour = clamp(existing.honourScore + honourDelta, MIN_HONOUR, MAX_HONOUR);

      const updatedRating = await tx.communityDriverRating.update({
        where: { id: existing.id },
        data: {
          skillRating: nextSkill,
          honourScore: nextHonour,
          starts: { increment: 1 },
          wins: { increment: entry.finishingPosition === 1 ? 1 : 0 },
          podiums: { increment: entry.finishingPosition <= 3 ? 1 : 0 },
          cleanRaces: { increment: honourDelta > 0 ? 1 : 0 },
          incidents: { increment: honourDelta < 0 ? 1 : 0 },
          lastRaceAt: occurredAt,
        },
      });
      updatedRatings.push(updatedRating);

      if (input.applyGlobalRating) {
        const user = await tx.user.findUnique({ where: { id: entry.userId }, select: { honourScore: true } });
        await tx.user.update({
          where: { id: entry.userId },
          data: {
            skillRating: { increment: skillDelta },
            honourScore: clamp((user?.honourScore ?? DEFAULT_COMMUNITY_HONOUR) + honourDelta, MIN_HONOUR, MAX_HONOUR),
          },
        });
      }

      ratingEvents.push(await tx.communityRatingEvent.create({
        data: {
          organiserProfileId: input.organiserProfileId,
          userId: entry.userId,
          appliedById: input.submittedById,
          skillDelta,
          honourDelta,
          reason: `Community result submitted: ${eventName}`,
          metadata: {
            source: 'community_result',
            eventName,
            track: input.track ?? null,
            occurredAt: occurredAt.toISOString(),
            evidenceUrl: input.evidenceUrl ?? null,
            notes: input.notes ?? null,
            entryNotes: entry.notes ?? null,
            finishingPosition: entry.finishingPosition,
            totalDrivers,
            applyGlobalRating: Boolean(input.applyGlobalRating),
            entries: ordered.map((resultEntry) => ({
              userId: resultEntry.userId,
              finishingPosition: resultEntry.finishingPosition,
            })),
            before: { skillRating: existing.skillRating, honourScore: existing.honourScore },
            after: { skillRating: nextSkill, honourScore: nextHonour },
          } satisfies Prisma.JsonObject,
        },
      }));
    }

    return {
      result: {
        organiserProfileId: input.organiserProfileId,
        eventName,
        track: input.track ?? null,
        occurredAt,
        evidenceUrl: input.evidenceUrl ?? null,
        notes: input.notes ?? null,
        submittedById: input.submittedById,
        totalDrivers,
      },
      ratingEvents,
      updatedRatings,
    };
  });
}

export const getCommunityRankings = async (slug: string, view: CommunityRankingView = 'sr', limit = 25) =>
  withPerf('communityRankings.fetch', async () => {
    const community = await prisma.organiserProfile.findFirst({
      where: { slug, isPublic: true },
      select: { id: true, slug: true, displayName: true, logoUrl: true, verified: true },
    });
    if (!community) return null;

    const take = clamp(limit, 1, 100);
    const ratings = await prisma.communityDriverRating.findMany({
      where: { organiserProfileId: community.id },
      include: { user: { select: { id: true, username: true, avatarUrl: true, region: true } } },
      orderBy: getRankingOrder(view),
      take: view === 'movers' ? Math.max(take, 50) : take,
    });

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const events = ratings.length
      ? await prisma.communityRatingEvent.groupBy({
          by: ['userId'],
          where: { organiserProfileId: community.id, userId: { in: ratings.map((rating) => rating.userId) }, createdAt: { gte: since } },
          _sum: { skillDelta: true, honourDelta: true },
        })
      : [];

    const eventMap = new Map(events.map((event) => [event.userId, event._sum]));
    const rows = ratings.map((rating) => ({
      id: rating.id,
      user: rating.user,
      skillRating: rating.skillRating,
      honourScore: rating.honourScore,
      starts: rating.starts,
      wins: rating.wins,
      podiums: rating.podiums,
      cleanRaces: rating.cleanRaces,
      incidents: rating.incidents,
      disputesOpened: rating.disputesOpened,
      disputesLost: rating.disputesLost,
      lastRaceAt: rating.lastRaceAt,
      cleanRaceRatio: rating.starts ? Math.round((rating.cleanRaces / rating.starts) * 100) : 0,
      recentSkillDelta: eventMap.get(rating.userId)?.skillDelta ?? 0,
      recentHonourDelta: eventMap.get(rating.userId)?.honourDelta ?? 0,
    }));

    const sortedRows = view === 'movers'
      ? rows.sort((a, b) => Math.abs(b.recentSkillDelta) - Math.abs(a.recentSkillDelta) || b.skillRating - a.skillRating).slice(0, take)
      : rows;

    return {
      community,
      view,
      rows: sortedRows.map((row, index) => ({ rank: index + 1, ...row })),
    };
  });

export const getProfileCommunityRankings = async (userId: string, limit = 5) =>
  withPerf('profile.communityRankings', async () => {
    const ratings = await prisma.communityDriverRating.findMany({
      where: { userId },
      include: {
        organiserProfile: { select: { id: true, slug: true, displayName: true, logoUrl: true, verified: true, featured: true } },
      },
      orderBy: [{ skillRating: 'desc' }, { honourScore: 'desc' }],
      take: clamp(limit, 1, 12),
    });

    const rankedRows = await Promise.all(ratings.map(async (rating) => {
      const rank = await prisma.communityDriverRating.count({
        where: {
          organiserProfileId: rating.organiserProfileId,
          OR: [
            { skillRating: { gt: rating.skillRating } },
            { skillRating: rating.skillRating, honourScore: { gt: rating.honourScore } },
          ],
        },
      });

      return {
        community: rating.organiserProfile,
        rank: rank + 1,
        skillRating: rating.skillRating,
        honourScore: rating.honourScore,
        starts: rating.starts,
        wins: rating.wins,
        podiums: rating.podiums,
        cleanRaceRatio: rating.starts ? Math.round((rating.cleanRaces / rating.starts) * 100) : 0,
        lastRaceAt: rating.lastRaceAt,
      };
    }));

    return rankedRows;
  });
