export const prerender = false;

import type { APIRoute } from 'astro';
import { prisma } from '@/lib/db/prisma';
import { getNumericLimit, withErrorHandling } from '@/lib/utils/handlers';
import { jsonResponse } from '@/lib/utils/http';
import { requireAdmin, requireUser } from '@/server/permissions/authz';

export const GET: APIRoute = (context) =>
  withErrorHandling(async () => {
    const admin = await requireUser(context);
    requireAdmin(admin);

    const q = context.url.searchParams.get('q')?.trim();
    const status = context.url.searchParams.get('status');
    const visibility = context.url.searchParams.get('visibility');

    const raceSlots = await prisma.raceSlot.findMany({
      where: {
        ...(status ? { status: status as never } : {}),
        ...(visibility ? { visibility: visibility as never } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { track: { contains: q, mode: 'insensitive' } },
                { league: { name: { contains: q, mode: 'insensitive' } } },
                { organiser: { username: { contains: q, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      include: {
        league: { select: { id: true, name: true, slug: true } },
        organiser: { select: { id: true, username: true } },
        organiserProfile: { select: { id: true, slug: true, displayName: true } },
        _count: { select: { registrations: true, disputes: true, moderationActions: true } },
      },
      orderBy: [{ scheduledAt: 'desc' }, { createdAt: 'desc' }],
      take: getNumericLimit(context, 50, 100),
    });

    return jsonResponse(200, { raceSlots });
  });
