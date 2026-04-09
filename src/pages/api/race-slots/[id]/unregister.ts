export const prerender = false;

import type { APIRoute } from 'astro';
import { prisma } from '@/lib/db/prisma';
import { withErrorHandling } from '@/lib/utils/handlers';
import { HttpError, jsonResponse } from '@/lib/utils/http';
import { requireUser } from '@/server/permissions/authz';

export const POST: APIRoute = (context) =>
  withErrorHandling(async () => {
    const user = await requireUser(context);
    const id = context.params.id;
    if (!id) throw new HttpError(400, 'Race slot ID is required.');

    const slot = await prisma.raceSlot.findUnique({ where: { id } });
    if (!slot) throw new HttpError(404, 'Race slot not found.');
    if (slot.registrationCutoffAt.getTime() <= Date.now()) {
      throw new HttpError(400, 'Cannot unregister after cutoff.');
    }

    const deleted = await prisma.raceRegistration.deleteMany({ where: { raceSlotId: id, userId: user.id } });
    if (deleted.count === 0) throw new HttpError(404, 'Registration not found.');

    if (slot.status === 'FULL') {
      await prisma.raceSlot.update({ where: { id }, data: { status: 'OPEN' } });
    }

    return jsonResponse(200, { ok: true });
  });
