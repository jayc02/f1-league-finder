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

    const slot = await prisma.raceSlot.findUnique({
      where: { id },
      include: { _count: { select: { registrations: true } } },
    });
    if (!slot) throw new HttpError(404, 'Race slot not found.');
    if (!['OPEN', 'FULL'].includes(slot.status)) {
      throw new HttpError(400, 'Registration is only available for open/full slots.');
    }
    if (slot.registrationCutoffAt.getTime() <= Date.now()) {
      throw new HttpError(400, 'Registration cutoff has passed.');
    }

    if (slot._count.registrations >= slot.maxPlayers) {
      await prisma.raceSlot.update({ where: { id }, data: { status: 'FULL' } });
      throw new HttpError(400, 'Race slot is full.');
    }

    try {
      await prisma.raceRegistration.create({
        data: { raceSlotId: id, userId: user.id },
      });
    } catch {
      throw new HttpError(409, 'You are already registered for this race slot.');
    }

    const registrationCount = await prisma.raceRegistration.count({ where: { raceSlotId: id } });
    if (registrationCount >= slot.maxPlayers) {
      await prisma.raceSlot.update({ where: { id }, data: { status: 'FULL' } });
    }

    return jsonResponse(201, { ok: true });
  });
