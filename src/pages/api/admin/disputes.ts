import type { APIRoute } from 'astro';
import { prisma } from '@/lib/db/prisma';
import { getNumericLimit, withErrorHandling } from '@/lib/utils/handlers';
import { jsonResponse } from '@/lib/utils/http';
import { requireAdmin, requireUser } from '@/server/permissions/authz';

export const GET: APIRoute = (context) =>
  withErrorHandling(async () => {
    const user = await requireUser(context);
    requireAdmin(user);

    const disputes = await prisma.dispute.findMany({
      include: {
        openedBy: { select: { id: true, username: true } },
        raceSlot: { select: { id: true, title: true } },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      take: getNumericLimit(context, 100, 200),
    });

    return jsonResponse(200, { disputes });
  });
