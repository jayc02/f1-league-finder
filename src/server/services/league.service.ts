import { prisma } from '@/lib/db/prisma';
import { withPerf } from '@/lib/utils/perf';

export const getPublicLeagueSummaries = async (limit = 50) =>
  withPerf('leagues.index', () =>
    prisma.league.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        region: true,
        active: true,
        owner: { select: { id: true, username: true } },
        _count: { select: { raceSlots: true } },
      },
      orderBy: [{ active: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    }),
  );

export const getPublicLeagueDetail = async (slug: string) =>
  withPerf('leagues.detail', () =>
    prisma.league.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        region: true,
        owner: { select: { id: true, username: true } },
        raceSlots: {
          where: { status: { in: ['OPEN', 'FULL', 'LOCKED', 'COMPLETED'] } },
          take: 10,
          orderBy: { scheduledAt: 'desc' },
          select: {
            id: true,
            title: true,
            status: true,
            scheduledAt: true,
            _count: { select: { registrations: true } },
          },
        },
      },
    }),
  );
