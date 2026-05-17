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
    const visibility = context.url.searchParams.get('visibility');

    const communities = await prisma.organiserProfile.findMany({
      where: {
        ...(visibility === 'public' ? { isPublic: true } : {}),
        ...(visibility === 'private' ? { isPublic: false } : {}),
        ...(q
          ? {
              OR: [
                { displayName: { contains: q, mode: 'insensitive' } },
                { slug: { contains: q, mode: 'insensitive' } },
                { user: { username: { contains: q, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      include: {
        user: { select: { id: true, username: true, email: true, role: true } },
        _count: { select: { raceSlots: true, leagues: true } },
      },
      orderBy: [{ featured: 'desc' }, { verified: 'desc' }, { updatedAt: 'desc' }],
      take: getNumericLimit(context, 50, 100),
    });

    return jsonResponse(200, { communities });
  });
