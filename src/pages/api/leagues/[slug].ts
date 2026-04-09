export const prerender = false;

import type { APIRoute } from 'astro';
import { prisma } from '@/lib/db/prisma';
import { withErrorHandling } from '@/lib/utils/handlers';
import { HttpError, jsonResponse } from '@/lib/utils/http';

export const GET: APIRoute = (context) =>
  withErrorHandling(async () => {
    const slug = context.params.slug;
    if (!slug) throw new HttpError(400, 'League slug is required.');

    const league = await prisma.league.findUnique({
      where: { slug },
      include: {
        owner: { select: { id: true, username: true } },
        raceSlots: {
          where: { status: { in: ['OPEN', 'FULL', 'LOCKED', 'COMPLETED'] } },
          take: 10,
          orderBy: { scheduledAt: 'desc' },
          include: { _count: { select: { registrations: true } } },
        },
      },
    });

    if (!league) throw new HttpError(404, 'League not found.');
    return jsonResponse(200, { league });
  });
