import type { APIRoute } from 'astro';
import { prisma } from '@/lib/db/prisma';
import { adminRaceSlotSchema } from '@/lib/validation/admin';
import { parseBody, withErrorHandling } from '@/lib/utils/handlers';
import { HttpError, jsonResponse } from '@/lib/utils/http';
import { requireAdmin, requireUser } from '@/server/permissions/authz';

export const PATCH: APIRoute = (context) =>
  withErrorHandling(async () => {
    const admin = await requireUser(context);
    requireAdmin(admin);

    const id = context.params.id;
    if (!id) throw new HttpError(400, 'Race slot ID is required.');

    const body = await parseBody(context.request, adminRaceSlotSchema);

    const slot = await prisma.raceSlot.update({ where: { id }, data: body });

    await prisma.moderationAction.create({
      data: {
        actionType: 'RESULT_AMENDMENT',
        targetUserId: slot.organiserId,
        adminId: admin.id,
        raceSlotId: slot.id,
        notes: `Admin updated race slot ${slot.title}`,
        metadata: body,
      },
    });

    return jsonResponse(200, { raceSlot: slot });
  });
