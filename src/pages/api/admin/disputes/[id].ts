export const prerender = false;

import type { APIRoute } from 'astro';
import { assertAllowedOrigin } from '@/lib/server/origin-guard';
import { prisma } from '@/lib/db/prisma';
import { updateDisputeSchema } from '@/lib/validation/dispute';
import { parseBody, withErrorHandling } from '@/lib/utils/handlers';
import { HttpError, jsonResponse } from '@/lib/utils/http';
import { requireAdmin, requireUser } from '@/server/permissions/authz';

export const GET: APIRoute = (context) =>
  withErrorHandling(async () => {
    const admin = await requireUser(context);
    requireAdmin(admin);

    const id = context.params.id;
    if (!id) throw new HttpError(400, 'Dispute ID is required.');

    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: {
        openedBy: { select: { id: true, username: true, email: true } },
        resolvedBy: { select: { id: true, username: true } },
        raceSlot: {
          select: {
            id: true,
            title: true,
            scheduledAt: true,
            organiser: { select: { id: true, username: true, email: true } },
            organiserProfile: { select: { id: true, displayName: true } },
            league: { select: { id: true, name: true } },
          },
        },
        raceResult: { select: { id: true, confirmationState: true, evidenceUrl: true } },
        statusLogs: {
          include: { changedBy: { select: { id: true, username: true } } },
          orderBy: { createdAt: 'desc' },
        },
        emailLogs: {
          include: {
            sentBy: { select: { id: true, username: true } },
            recipient: { select: { id: true, username: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!dispute) throw new HttpError(404, 'Dispute not found.');

    return jsonResponse(200, { dispute });
  });

export const PATCH: APIRoute = (context) =>
  withErrorHandling(async () => {
    assertAllowedOrigin(context.request);
    const admin = await requireUser(context);
    requireAdmin(admin);

    const id = context.params.id;
    if (!id) throw new HttpError(400, 'Dispute ID is required.');

    const existing = await prisma.dispute.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, 'Dispute not found.');

    const body = await parseBody(context.request, updateDisputeSchema);

    const nextStatus = body.status ?? existing.status;
    const closingStatus = ['RESOLVED', 'REJECTED'].includes(nextStatus);

    const updated = await prisma.$transaction(async (tx) => {
      const dispute = await tx.dispute.update({
        where: { id },
        data: {
          status: body.status,
          adminNotes: body.adminNotes,
          resolutionNotes: body.resolutionNotes,
          resolvedAt: closingStatus ? new Date() : null,
          resolvedById: closingStatus ? admin.id : null,
        },
      });

      if (body.status && body.status !== existing.status) {
        await tx.disputeStatusLog.create({
          data: {
            disputeId: id,
            fromStatus: existing.status,
            toStatus: body.status,
            note: body.resolutionNotes ?? body.adminNotes,
            changedById: admin.id,
          },
        });
      }

      await tx.moderationAction.create({
        data: {
          actionType: 'DISPUTE_RESOLUTION',
          targetUserId: existing.openedById,
          adminId: admin.id,
          disputeId: id,
          raceSlotId: existing.raceSlotId,
          notes: `Dispute ${id} updated to ${dispute.status}`,
          metadata: {
            fromStatus: existing.status,
            toStatus: body.status,
            adminNotes: body.adminNotes,
            resolutionNotes: body.resolutionNotes,
          },
        },
      });

      return dispute;
    });

    return jsonResponse(200, { dispute: updated });
  });
