import { prisma } from '@/lib/db/prisma';
import { getHonourGrade } from '@/lib/honour';

export type CommunityRankingType = 'sr' | 'honour' | 'clean' | 'wins' | 'recent';

const ratingSelect = {
  userId: true,
  skillRating: true,
  honourScore: true,
  starts: true,
  wins: true,
  podiums: true,
  cleanRaces: true,
  incidents: true,
  lastRaceAt: true,
  updatedAt: true,
  user: { select: { id: true, username: true, avatarUrl: true } },
} as const;

export async function getOrCreateCommunityDriverRating(organiserProfileId: string, userId: string) {
  return prisma.communityDriverRating.upsert({
    where: { organiserProfileId_userId: { organiserProfileId, userId } },
    update: {},
    create: { organiserProfileId, userId },
  });
}

export async function getCommunityRankings({ organiserProfileId, type, limit = 25 }: { organiserProfileId: string; type: CommunityRankingType; limit?: number; cursor?: string | null; page?: number; }) {
  const take = Math.min(Math.max(limit, 1), 100);
  const orderBy = type === 'honour' ? [{ honourScore: 'desc' as const }, { skillRating: 'desc' as const }]
    : type === 'clean' ? [{ cleanRaces: 'desc' as const }, { incidents: 'asc' as const }, { starts: 'desc' as const }]
    : type === 'wins' ? [{ wins: 'desc' as const }, { podiums: 'desc' as const }, { skillRating: 'desc' as const }]
    : type === 'recent' ? [{ updatedAt: 'desc' as const }]
    : [{ skillRating: 'desc' as const }, { honourScore: 'desc' as const }];

  const rows = await prisma.communityDriverRating.findMany({
    where: { organiserProfileId }, select: ratingSelect, orderBy, take,
  });

  return rows.map((row, i) => ({
    rank: i + 1,
    user: { id: row.user.id, username: row.user.username, avatarUrl: row.user.avatarUrl },
    skillRating: row.skillRating,
    honourScore: row.honourScore,
    honourGrade: getHonourGrade(row.honourScore).grade,
    starts: row.starts,
    wins: row.wins,
    podiums: row.podiums,
    cleanRaces: row.cleanRaces,
    incidents: row.incidents,
    lastRaceAt: row.lastRaceAt,
  }));
}

export async function getCommunityDriverRank({ organiserProfileId, userId }: { organiserProfileId: string; userId: string; }) {
  const rating = await getOrCreateCommunityDriverRating(organiserProfileId, userId);
  const higher = await prisma.communityDriverRating.count({ where: { organiserProfileId, OR: [ { skillRating: { gt: rating.skillRating } }, { skillRating: rating.skillRating, honourScore: { gt: rating.honourScore } } ] } });
  return { rank: higher + 1, rating };
}

export async function applyCommunityRatingEvent(input: { organiserProfileId: string; userId: string; raceSlotId?: string | null; duelId?: string | null; raceResultId?: string | null; appliedById?: string | null; skillDelta: number; honourDelta: number; reason: string; metadata?: Record<string, unknown> | null; }) {
  return prisma.$transaction(async (tx) => {
    const rating = await tx.communityDriverRating.upsert({ where: { organiserProfileId_userId: { organiserProfileId: input.organiserProfileId, userId: input.userId } }, update: {}, create: { organiserProfileId: input.organiserProfileId, userId: input.userId } });
    const updated = await tx.communityDriverRating.update({ where: { id: rating.id }, data: { skillRating: { increment: input.skillDelta }, honourScore: { increment: input.honourDelta } } });
    const event = await tx.communityRatingEvent.create({ data: { ...input } });
    return { updated, event };
  });
}

export async function submitCommunityResult(input: { organiserProfileId: string; submittedById: string; eventName: string; track?: string | null; occurredAt: Date; entries: Array<{ userId: string; position: number; cleanRace: boolean; incidents: number; notes?: string | null; }>; applyGlobalRating?: boolean; notes?: string | null; evidenceUrl?: string | null; }) {
  const total = Math.max(input.entries.length, 1);
  return prisma.$transaction(async (tx) => {
    const out = [] as Array<{ userId: string; skillDelta: number; honourDelta: number }>;
    for (const entry of input.entries) {
      const posBonus = Math.max(-6, 12 - (entry.position - 1) * 3);
      const skillDelta = posBonus;
      const honourDelta = (entry.cleanRace ? 3 : 0) - Math.max(0, entry.incidents) * 2;
      await tx.communityDriverRating.upsert({ where: { organiserProfileId_userId: { organiserProfileId: input.organiserProfileId, userId: entry.userId } }, update: { skillRating: { increment: skillDelta }, honourScore: { increment: honourDelta }, starts: { increment: 1 }, wins: { increment: entry.position === 1 ? 1 : 0 }, podiums: { increment: entry.position <= 3 ? 1 : 0 }, cleanRaces: { increment: entry.cleanRace ? 1 : 0 }, incidents: { increment: entry.incidents }, lastRaceAt: input.occurredAt }, create: { organiserProfileId: input.organiserProfileId, userId: entry.userId, skillRating: 1000 + skillDelta, honourScore: 100 + honourDelta, starts: 1, wins: entry.position === 1 ? 1 : 0, podiums: entry.position <= 3 ? 1 : 0, cleanRaces: entry.cleanRace ? 1 : 0, incidents: entry.incidents, lastRaceAt: input.occurredAt } });
      await tx.communityRatingEvent.create({ data: { organiserProfileId: input.organiserProfileId, userId: entry.userId, appliedById: input.submittedById, skillDelta, honourDelta, reason: `Community result: ${input.eventName}`, metadata: { eventName: input.eventName, track: input.track ?? null, occurredAt: input.occurredAt, position: entry.position, notes: entry.notes ?? null, evidenceUrl: input.evidenceUrl ?? null } } });
      if (input.applyGlobalRating) {
        await tx.user.update({ where: { id: entry.userId }, data: { skillRating: { increment: Math.round(skillDelta / 2) }, honourScore: { increment: honourDelta } } });
      }
      out.push({ userId: entry.userId, skillDelta, honourDelta });
    }
    return { applied: out, totalDrivers: total };
  });
}
