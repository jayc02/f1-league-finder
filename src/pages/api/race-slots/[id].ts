export const prerender = false;

import type { APIRoute } from 'astro';
import { assertAllowedOrigin } from '@/lib/server/origin-guard';
import { prisma } from '@/lib/db/prisma';
import { privateApiNoStore } from '@/lib/server/cache-control';
import { updateRaceSlotSchema } from '@/lib/validation/race-slot';
import { parseBody, withErrorHandling } from '@/lib/utils/handlers';
import { HttpError, jsonResponse } from '@/lib/utils/http';
import { requireUser } from '@/server/permissions/authz';
import { canManageCommunityRaces } from '@/lib/server/community-permissions';
import { getSessionUser } from '@/lib/auth/session';
import { getRaceSlotDetailForViewer, toRaceSlotDetailPayload } from '@/server/services/race-slot.service';

export const GET: APIRoute = (context) =>
  withErrorHandling(async () => {
    const id = context.params.id;
    if (!id) throw new HttpError(400, 'Race slot ID is required.');

    const sessionUser = await getSessionUser(context);
    const result = await getRaceSlotDetailForViewer({ raceSlotId: id, viewerUserId: sessionUser?.id });

    if (result.status === 'not_found') throw new HttpError(404, 'Race slot not found.');
    if (result.status === 'access_denied') throw new HttpError(403, result.message);

    const response = jsonResponse(200, { raceSlot: toRaceSlotDetailPayload(result.raceSlot) });
    response.headers.set('Cache-Control', privateApiNoStore);
    return response;
  });

export const PATCH: APIRoute = (context) =>
  withErrorHandling(async () => {
    assertAllowedOrigin(context.request);
    const user = await requireUser(context);
    const id = context.params.id;
    if (!id) throw new HttpError(400, 'Race slot ID is required.');

    const slot = await prisma.raceSlot.findUnique({
      where: { id },
      include: { league: true, organiserProfile: true, _count: { select: { registrations: true } } },
    });
    if (!slot) throw new HttpError(404, 'Race slot not found.');

    const canEdit = user.role === 'ADMIN' || slot.organiserId === user.id || slot.league.ownerId === user.id || Boolean(slot.organiserProfile && (await canManageCommunityRaces(user, slot.organiserProfile)));
    if (!canEdit) throw new HttpError(403, 'Forbidden.');

    const body = await parseBody(context.request, updateRaceSlotSchema);

    if (body.status === 'CANCELLED' && !body.cancellationReason) {
      throw new HttpError(400, 'Cancellation reason is required for cancelled slots.');
    }

    if (body.maxPlayers && body.maxPlayers < slot._count.registrations) {
      throw new HttpError(400, 'maxPlayers cannot be below current registrations.');
    }

    const updated = await prisma.raceSlot.update({ where: { id }, data: body });

    const response = jsonResponse(200, { raceSlot: updated });
    response.headers.set('Cache-Control', privateApiNoStore);
    return response;
  });

export const DELETE: APIRoute = (context) =>
  withErrorHandling(async () => {
    assertAllowedOrigin(context.request);
    const user = await requireUser(context);
    const id = context.params.id;
    if (!id) throw new HttpError(400, 'Race slot ID is required.');

    const slot = await prisma.raceSlot.findUnique({
      where: { id },
      include: { league: true, organiserProfile: true, _count: { select: { registrations: true } } },
    });
    if (!slot) throw new HttpError(404, 'Race slot not found.');

    const canEdit = user.role === 'ADMIN' || slot.organiserId === user.id || slot.league.ownerId === user.id || Boolean(slot.organiserProfile && (await canManageCommunityRaces(user, slot.organiserProfile)));
    if (!canEdit) throw new HttpError(403, 'Forbidden.');

    if (slot._count.registrations > 0) {
      const cancelled = await prisma.raceSlot.update({
        where: { id },
        data: { status: 'CANCELLED', cancellationReason: 'Cancelled by community staff.' },
      });
      const response = jsonResponse(200, { raceSlot: cancelled, cancelled: true });
      response.headers.set('Cache-Control', privateApiNoStore);
      return response;
    }

    await prisma.raceSlot.delete({ where: { id } });
    const response = jsonResponse(200, { ok: true });
    response.headers.set('Cache-Control', privateApiNoStore);
    return response;
  });
