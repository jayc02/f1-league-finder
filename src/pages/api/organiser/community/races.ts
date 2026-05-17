export const prerender = false;

import { OrganiserProfileMemberRole } from '@prisma/client';
import type { APIRoute } from 'astro';
import { prisma } from '@/lib/db/prisma';
import { getNumericLimit, withErrorHandling } from '@/lib/utils/handlers';
import { HttpError, jsonResponse } from '@/lib/utils/http';
import { requireCommunityRole } from '@/lib/server/community-permissions';

export const GET: APIRoute = (context) =>
  withErrorHandling(async () => {
    const organiserProfileId = context.url.searchParams.get('organiserProfileId');
    if (!organiserProfileId) throw new HttpError(400, 'Community ID is required.');
    await requireCommunityRole(context, organiserProfileId, [OrganiserProfileMemberRole.OWNER, OrganiserProfileMemberRole.ADMIN, OrganiserProfileMemberRole.MODERATOR]);

    const take = getNumericLimit(context, 25, 100);
    const skip = Math.max(Number(context.url.searchParams.get('skip') ?? 0) || 0, 0);
    const raceSlots = await prisma.raceSlot.findMany({
      where: { organiserProfileId },
      select: {
        id: true,
        title: true,
        visibility: true,
        status: true,
        scheduledAt: true,
        maxPlayers: true,
        league: { select: { name: true } },
        _count: { select: { registrations: true } },
      },
      orderBy: { scheduledAt: 'desc' },
      skip,
      take,
    });

    return jsonResponse(200, { raceSlots, pagination: { skip, take } });
  });
