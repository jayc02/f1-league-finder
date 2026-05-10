export const prerender = false;

import type { APIRoute } from 'astro';
import { assertAllowedOrigin } from '@/lib/server/origin-guard';
import { prisma } from '@/lib/db/prisma';
import { privateApiNoStore } from '@/lib/server/cache-control';
import { updateRaceSlotSchema } from '@/lib/validation/race-slot';
import { parseBody, withErrorHandling } from '@/lib/utils/handlers';
import { HttpError, jsonResponse } from '@/lib/utils/http';
import { requireUser } from '@/server/permissions/authz';
import { canManageCommunityRaces, getCommunityMembership } from '@/lib/server/community-permissions';
import { getSessionUser } from '@/lib/auth/session';

export const GET: APIRoute = (context) =>
  withErrorHandling(async () => {
    const id = context.params.id;
    if (!id) throw new HttpError(400, 'Race slot ID is required.');

    const sessionUser = await getSessionUser(context);

    const slot = await prisma.raceSlot.findUnique({
      where: { id },
      include: {
        league: { select: { id: true, name: true, slug: true } },
        organiser: { select: { id: true, username: true } },
        organiserProfile: { select: { id: true, slug: true, displayName: true, logoUrl: true } },
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

    const membership = sessionUser && slot.organiserProfileId ? await getCommunityMembership(sessionUser.id, slot.organiserProfileId) : null;
    const canViewPrivate = Boolean(sessionUser && (sessionUser.role === 'ADMIN' || sessionUser.id === slot.organiserId || membership?.status === 'ACTIVE'));
    if (slot.visibility === 'COMMUNITY_ONLY' && !canViewPrivate) {
      throw new HttpError(403, 'This event is only visible to community members.');
    }

    if (slot.visibility === 'PRIVATE' && !canViewPrivate) {
      throw new HttpError(403, 'This event is private.');
    }

    if (slot.visibility === 'UNLISTED' && !canViewPrivate && slot.status === 'DRAFT') {
      throw new HttpError(403, 'This event is not published yet.');
    }

    return jsonResponse(200, { raceSlot: slot });
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
