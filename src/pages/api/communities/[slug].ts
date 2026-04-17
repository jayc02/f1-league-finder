export const prerender = false;

import type { APIRoute } from 'astro';
import { prisma } from '@/lib/db/prisma';
import { HttpError, jsonResponse } from '@/lib/utils/http';
import { withErrorHandling } from '@/lib/utils/handlers';

export const GET: APIRoute = (context) =>
  withErrorHandling(async () => {
    const slug = context.params.slug;
    if (!slug) throw new HttpError(400, 'Community slug is required.');

    const community = await prisma.organiserProfile.findUnique({
      where: { slug },
      include: {
        user: { select: { id: true, username: true, honourScore: true } },
        leagues: {
          where: { active: true },
          select: { id: true, name: true, slug: true, region: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!community || !community.isPublic) throw new HttpError(404, 'Community not found.');

    const now = new Date();
    const [upcomingEvents, recentEvents] = await Promise.all([
      prisma.raceSlot.findMany({
        where: {
          organiserProfileId: community.id,
          scheduledAt: { gte: now },
          status: { in: ['OPEN', 'FULL', 'LOCKED'] },
          visibility: 'PUBLIC',
        },
        include: {
          league: { select: { id: true, name: true, slug: true } },
          _count: { select: { registrations: true } },
        },
        orderBy: { scheduledAt: 'asc' },
        take: 6,
      }),
      prisma.raceSlot.findMany({
        where: {
          organiserProfileId: community.id,
          scheduledAt: { lt: now },
          status: { in: ['COMPLETED', 'CANCELLED'] },
          visibility: 'PUBLIC',
        },
        include: {
          league: { select: { id: true, name: true, slug: true } },
          _count: { select: { registrations: true } },
        },
        orderBy: { scheduledAt: 'desc' },
        take: 5,
      }),
    ]);

    return jsonResponse(200, { community, upcomingEvents, recentEvents });
  });
