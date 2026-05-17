export const prerender = false;

import type { APIRoute } from 'astro';
import { prisma } from '@/lib/db/prisma';
import { getNumericLimit, withErrorHandling } from '@/lib/utils/handlers';
import { jsonResponse } from '@/lib/utils/http';
import { requireAdmin, requireUser } from '@/server/permissions/authz';

export const GET: APIRoute = (context) =>
  withErrorHandling(async () => {
    const user = await requireUser(context);
    requireAdmin(user);

    const q = context.url.searchParams.get('q')?.trim();
    const role = context.url.searchParams.get('role');
    const suspended = context.url.searchParams.get('suspended');

    const users = await prisma.user.findMany({
      where: {
        ...(role ? { role: role as never } : {}),
        ...(suspended === '1' ? { NOT: { suspensionNote: null } } : {}),
        ...(q
          ? {
              OR: [
                { username: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
                { eaIdTag: { contains: q, mode: 'insensitive' } },
                { discordTag: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        region: true,
        honourScore: true,
        skillRating: true,
        suspensionNote: true,
        createdAt: true,
        preferredPlatform: true,
        organiserProfile: {
          select: {
            id: true,
            displayName: true,
            verified: true,
            isPublic: true,
            featured: true,
          },
        },
        _count: {
          select: {
            raceRegistrations: true,
            raceSlotsOrganised: true,
            disputesOpened: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: getNumericLimit(context, 50, 100),
    });

    return jsonResponse(200, { users });
  });
