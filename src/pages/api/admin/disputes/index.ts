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

    const statusFilter = context.url.searchParams.get('scope') ?? 'open';
    const q = context.url.searchParams.get('q')?.trim();

    const openStatuses = ['OPEN', 'UNDER_REVIEW'] as const;
    const closedStatuses = ['RESOLVED', 'REJECTED'] as const;

    const statusWhere = statusFilter === 'closed'
      ? { in: closedStatuses }
      : statusFilter === 'all'
        ? undefined
        : { in: openStatuses };

    const disputes = await prisma.dispute.findMany({
      where: {
        ...(statusWhere ? { status: statusWhere } : {}),
        ...(q
          ? {
              OR: [
                { id: { contains: q, mode: 'insensitive' } },
                { reason: { contains: q, mode: 'insensitive' } },
                { raceSlot: { title: { contains: q, mode: 'insensitive' } } },
                { openedBy: { username: { contains: q, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      include: {
        openedBy: { select: { id: true, username: true, email: true } },
        resolvedBy: { select: { id: true, username: true } },
        raceSlot: {
          select: {
            id: true,
            title: true,
            organiser: { select: { id: true, username: true, email: true } },
            organiserProfile: { select: { id: true, displayName: true } },
            league: { select: { id: true, name: true } },
          },
        },
        statusLogs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { changedBy: { select: { id: true, username: true } } },
        },
        _count: { select: { moderationActions: true, emailLogs: true } },
      },
      orderBy: [{ createdAt: 'desc' }],
      take: getNumericLimit(context, 80, 300),
    });

    return jsonResponse(200, { disputes });
  });
