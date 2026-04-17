export const prerender = false;

import type { APIRoute } from 'astro';
import { prisma } from '@/lib/db/prisma';
import { getNumericLimit, withErrorHandling } from '@/lib/utils/handlers';
import { jsonResponse } from '@/lib/utils/http';

export const GET: APIRoute = (context) =>
  withErrorHandling(async () => {
    const q = context.url.searchParams.get('q')?.trim();
    const region = context.url.searchParams.get('region');
    const featuredOnly = context.url.searchParams.get('featured') === '1';

    const communities = await prisma.organiserProfile.findMany({
      where: {
        isPublic: true,
        ...(region ? { region: region as never } : {}),
        ...(featuredOnly ? { featured: true } : {}),
        ...(q
          ? {
              OR: [
                { displayName: { contains: q, mode: 'insensitive' } },
                { shortDescription: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
                { tags: { hasSome: q.split(' ').filter(Boolean) } },
              ],
            }
          : {}),
      },
      include: {
        _count: {
          select: {
            raceSlots: {
              where: { visibility: 'PUBLIC', status: { in: ['OPEN', 'FULL', 'LOCKED'] }, scheduledAt: { gte: new Date() } },
            },
          },
        },
      },
      orderBy: [{ featured: 'desc' }, { verified: 'desc' }, { displayedMemberCount: 'desc' }],
      take: getNumericLimit(context, 24, 100),
    });

    return jsonResponse(200, { communities });
  });
