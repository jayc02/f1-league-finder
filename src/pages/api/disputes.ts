import type { APIRoute } from 'astro';
import { prisma } from '@/lib/db/prisma';
import { createDisputeSchema } from '@/lib/validation/dispute';
import { parseBody, withErrorHandling } from '@/lib/utils/handlers';
import { HttpError, jsonResponse } from '@/lib/utils/http';
import { requireUser } from '@/server/permissions/authz';

export const POST: APIRoute = (context) =>
  withErrorHandling(async () => {
    const user = await requireUser(context);
    const body = await parseBody(context.request, createDisputeSchema);

    const slot = await prisma.raceSlot.findUnique({ where: { id: body.raceSlotId } });
    if (!slot) throw new HttpError(404, 'Race slot not found.');

    const userRegistered = await prisma.raceRegistration.findUnique({
      where: { raceSlotId_userId: { raceSlotId: body.raceSlotId, userId: user.id } },
    });
    const canCreate = user.role === 'ADMIN' || userRegistered || slot.organiserId === user.id;
    if (!canCreate) throw new HttpError(403, 'Only participants/organisers/admin can open dispute.');

    if (body.raceResultId) {
      const result = await prisma.raceResult.findUnique({ where: { id: body.raceResultId } });
      if (!result || result.raceSlotId !== body.raceSlotId) {
        throw new HttpError(400, 'Provided raceResultId does not belong to raceSlotId.');
      }
    }

    const dispute = await prisma.dispute.create({
      data: {
        raceSlotId: body.raceSlotId,
        raceResultId: body.raceResultId,
        openedById: user.id,
        reason: body.reason,
        details: body.details,
      },
    });

    return jsonResponse(201, { dispute });
  });
