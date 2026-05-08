export const prerender = false;

import type { APIRoute } from 'astro';
import { assertAllowedOrigin } from '@/lib/server/origin-guard';
import { HonourEventType } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { updateDisputeSchema } from '@/lib/validation/dispute';
import { parseBody, withErrorHandling } from '@/lib/utils/handlers';
import { HttpError, jsonResponse } from '@/lib/utils/http';
import { requireAdmin, requireUser } from '@/server/permissions/authz';
import { applyHonourEvent } from '@/server/services/honour.service';

export const GET: APIRoute = (context) =>
  withErrorHandling(async () => {
    const user = await requireUser(context);
    const id = context.params.id;
    if (!id) throw new HttpError(400, 'Dispute ID is required.');

    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: {
        openedBy: { select: { id: true, username: true } },
        raceSlot: { select: { id: true, title: true, scheduledAt: true, organiserId: true } },
        raceResult: true,
      },
    });
    if (!dispute) throw new HttpError(404, 'Dispute not found.');

    const hasAccess = user.role === 'ADMIN' || user.id === dispute.openedById || user.id === dispute.raceSlot.organiserId;
    if (!hasAccess) throw new HttpError(403, 'Forbidden.');

    return jsonResponse(200, { dispute });
  });

export const PATCH: APIRoute = (context) =>
  withErrorHandling(async () => {
    assertAllowedOrigin(context.request);
    const admin = await requireUser(context);
    requireAdmin(admin);

    const id = context.params.id;
    if (!id) throw new HttpError(400, 'Dispute ID is required.');

    const dispute = await prisma.dispute.findUnique({ where: { id } });
    if (!dispute) throw new HttpError(404, 'Dispute not found.');

    const body = await parseBody(context.request, updateDisputeSchema);

    if (body.honourAdjustment !== undefined && !body.targetUserId) {
      throw new HttpError(400, 'targetUserId is required with honourAdjustment.');
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (body.honourAdjustment && body.targetUserId) {
        await applyHonourEvent(tx, {
          userId: body.targetUserId,
          delta: body.honourAdjustment,
          reason: body.resolutionNotes ?? `Admin adjustment via dispute ${id}`,
          type: HonourEventType.ADMIN_ADJUSTMENT,
          appliedById: admin.id,
          raceSlotId: dispute.raceSlotId,
          raceResultId: dispute.raceResultId ?? undefined,
          warningIssued: body.honourAdjustment < 0,
          metadata: { disputeId: id },
        });

        await tx.moderationAction.create({
          data: {
            actionType: 'HONOUR_ADJUSTMENT',
            targetUserId: body.targetUserId,
            adminId: admin.id,
            disputeId: id,
            raceSlotId: dispute.raceSlotId,
            notes: body.resolutionNotes ?? 'Honour adjusted via dispute',
            metadata: { delta: body.honourAdjustment },
          },
        });
      }

      return tx.dispute.update({
        where: { id },
        data: {
          status: body.status,
          adminNotes: body.adminNotes,
          resolutionNotes: body.resolutionNotes,
          resolvedAt: body.status && ['RESOLVED', 'REJECTED'].includes(body.status) ? new Date() : undefined,
          resolvedById: admin.id,
        },
      });
    });

    return jsonResponse(200, { dispute: updated });
  });
