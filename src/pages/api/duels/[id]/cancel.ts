export const prerender = false;

import type { APIRoute } from 'astro';
import { DuelStatus } from '@prisma/client';
import { assertAllowedOrigin } from '@/lib/server/origin-guard';
import { privateApiNoStore } from '@/lib/server/cache-control';
import { prisma } from '@/lib/db/prisma';
import { withErrorHandling } from '@/lib/utils/handlers';
import { HttpError, jsonResponse } from '@/lib/utils/http';
import { requireUser } from '@/server/permissions/authz';

export const POST: APIRoute = (context) =>
  withErrorHandling(async () => {
    assertAllowedOrigin(context.request);
    const id = context.params.id;
    if (!id) throw new HttpError(400, 'Duel id is required.');
    const user = await requireUser(context);
    const duel = await prisma.duel.findUnique({ where: { id }, select: { createdById: true, status: true } });
    if (!duel) throw new HttpError(404, 'Duel not found.');
    if (duel.createdById !== user.id && user.role !== 'ADMIN') throw new HttpError(403, 'Only the creator can cancel this duel.');
    if (duel.status !== DuelStatus.OPEN) throw new HttpError(409, 'Only open duels can be cancelled.');
    const cancelled = await prisma.duel.update({ where: { id }, data: { status: DuelStatus.CANCELLED } });
    const response = jsonResponse(200, { duel: cancelled });
    response.headers.set('Cache-Control', privateApiNoStore);
    return response;
  });
