export const prerender = false;

import type { APIRoute } from 'astro';
import { publicApiShort } from '@/lib/server/cache-control';
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
        // General discovery includes every public OrganiserProfile; featured is only applied when explicitly requested.
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
        raceSlots: {
          where: { visibility: 'PUBLIC', status: { in: ['OPEN', 'FULL', 'LOCKED'] }, scheduledAt: { gte: new Date() } },
          select: { id: true, title: true, scheduledAt: true, maxPlayers: true, _count: { select: { registrations: true } } },
          orderBy: { scheduledAt: 'asc' },
          take: 2,
        },
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

    const response = jsonResponse(200, { communities });
    response.headers.set('Cache-Control', publicApiShort);
    return response;
  });
