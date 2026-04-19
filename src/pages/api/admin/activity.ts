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

    const [actions, disputes] = await Promise.all([
      prisma.moderationAction.findMany({
        include: {
          admin: { select: { id: true, username: true } },
          targetUser: { select: { id: true, username: true } },
          raceSlot: { select: { id: true, title: true } },
          dispute: { select: { id: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: getNumericLimit(context, 40, 200),
      }),
      prisma.dispute.findMany({
        where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } },
        include: {
          openedBy: { select: { id: true, username: true } },
          raceSlot: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    return jsonResponse(200, { actions, disputes });
  });
