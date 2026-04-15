export const prerender = false;

import type { APIRoute } from 'astro';
import { prisma } from '@/lib/db/prisma';
import { updateRaceSlotSchema } from '@/lib/validation/race-slot';
import { parseBody, withErrorHandling } from '@/lib/utils/handlers';
import { HttpError, jsonResponse } from '@/lib/utils/http';
import { requireUser } from '@/server/permissions/authz';

export const GET: APIRoute = (context) =>
  withErrorHandling(async () => {
    const id = context.params.id;
    if (!id) throw new HttpError(400, 'Race slot ID is required.');

    const slot = await prisma.raceSlot.findUnique({
      where: { id },
      include: {
        league: { select: { id: true, name: true, slug: true } },
        organiser: { select: { id: true, username: true } },
        registrations: {
          select: {
            id: true,
            user: { select: { id: true, username: true, avatarUrl: true, skillRating: true, honourScore: true } },
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: { select: { registrations: true } },
        result: {
          include: {
            entries: {
              orderBy: { finishingPosition: 'asc' },
              include: { user: { select: { id: true, username: true } } },
            },
          },
        },
      },
    });
    if (!slot) throw new HttpError(404, 'Race slot not found.');

    return jsonResponse(200, { raceSlot: slot });
  });

export const PATCH: APIRoute = (context) =>
  withErrorHandling(async () => {
    const user = await requireUser(context);
    const id = context.params.id;
    if (!id) throw new HttpError(400, 'Race slot ID is required.');

    const slot = await prisma.raceSlot.findUnique({
      where: { id },
      include: { league: true, _count: { select: { registrations: true } } },
    });
    if (!slot) throw new HttpError(404, 'Race slot not found.');

    const canEdit = user.role === 'ADMIN' || slot.organiserId === user.id || slot.league.ownerId === user.id;
    if (!canEdit) throw new HttpError(403, 'Forbidden.');

    const body = await parseBody(context.request, updateRaceSlotSchema);

    if (body.status === 'CANCELLED' && !body.cancellationReason) {
      throw new HttpError(400, 'Cancellation reason is required for cancelled slots.');
    }

    if (body.maxPlayers && body.maxPlayers < slot._count.registrations) {
      throw new HttpError(400, 'maxPlayers cannot be below current registrations.');
    }

    const updated = await prisma.raceSlot.update({ where: { id }, data: body });

    return jsonResponse(200, { raceSlot: updated });
  });
