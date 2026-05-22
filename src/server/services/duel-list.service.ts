import { DuelStatus, DuelVisibility, type Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { withPerf } from '@/lib/utils/perf';
import { duelListSelect } from '@/server/services/duel.service';

type PublicDuelFilters = {
  limit?: number;
  status?: DuelStatus;
  mode?: 'ranked' | 'unranked';
  track?: string;
};

export const getPublicDuelSummaries = async ({ limit = 30, status, mode, track }: PublicDuelFilters = {}) =>
  withPerf('duels.publicList', () =>
    prisma.duel.findMany({
      where: {
        visibility: DuelVisibility.PUBLIC,
        status: status ?? { in: [DuelStatus.OPEN, DuelStatus.ACCEPTED, DuelStatus.IN_PROGRESS, DuelStatus.AWAITING_CONFIRMATION, DuelStatus.COMPLETED] },
        ...(track ? { track } : {}),
        ...(mode === 'ranked' ? { ranked: true } : {}),
        ...(mode === 'unranked' ? { ranked: false } : {}),
      },
      select: duelListSelect,
      orderBy: [{ status: 'asc' }, { scheduledAt: 'asc' }, { createdAt: 'desc' }],
      take: limit,
    }),
  );

export const getDuelStatsSummary = async () =>
  withPerf('duels.statsSummary', async () => {
    const [open, active, completed] = await Promise.all([
      prisma.duel.count({ where: { visibility: DuelVisibility.PUBLIC, status: DuelStatus.OPEN } }),
      prisma.duel.count({ where: { visibility: DuelVisibility.PUBLIC, status: { in: [DuelStatus.ACCEPTED, DuelStatus.IN_PROGRESS, DuelStatus.AWAITING_CONFIRMATION] } } }),
      prisma.duel.count({ where: { visibility: DuelVisibility.PUBLIC, status: DuelStatus.COMPLETED } }),
    ]);
    return { open, active, completed };
  });

export const getFeaturedOpenDuels = async (limit = 6) =>
  withPerf('duels.featuredOpen', () =>
    prisma.duel.findMany({
      where: { visibility: DuelVisibility.PUBLIC, status: DuelStatus.OPEN },
      select: duelListSelect,
      orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'desc' }],
      take: limit,
    }),
  );

