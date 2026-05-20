export const prerender = false;

import type { APIRoute } from 'astro';
import { assertAllowedOrigin } from '@/lib/server/origin-guard';
import { privateApiNoStore, publicApiShort } from '@/lib/server/cache-control';
import { prisma } from '@/lib/db/prisma';
import { createDuelSchema, duelListQuerySchema } from '@/lib/validation/duels';
import { getNumericLimit, parseBody, withErrorHandling } from '@/lib/utils/handlers';
import { HttpError, jsonResponse } from '@/lib/utils/http';
import { requireUser } from '@/server/permissions/authz';
import { canCreateCommunityDuel, getPublicDuels } from '@/server/services/duel.service';
import { tokenPotDuelsCreationEnabled } from '@/lib/server/race-token-config';

export const GET: APIRoute = (context) =>
  withErrorHandling(async () => {
    const filters = duelListQuerySchema.parse(Object.fromEntries(context.url.searchParams));
    const duels = await getPublicDuels({ ...filters, limit: getNumericLimit(context, 30, 100) });
    const response = jsonResponse(200, { duels });
    response.headers.set('Cache-Control', publicApiShort);
    return response;
  });

export const POST: APIRoute = (context) =>
  withErrorHandling(async () => {
    assertAllowedOrigin(context.request);
    const user = await requireUser(context);
    const body = await parseBody(context.request, createDuelSchema);

    if (body.opponentId === user.id) throw new HttpError(400, 'You cannot challenge yourself.');
    if (body.opponentId) {
      const opponent = await prisma.user.findUnique({ where: { id: body.opponentId }, select: { id: true } });
      if (!opponent) throw new HttpError(404, 'Opponent not found.');
    }

    if (body.communityId) {
      const community = await prisma.organiserProfile.findUnique({ where: { id: body.communityId }, select: { id: true, userId: true } });
      if (!community) throw new HttpError(404, 'Community not found.');
      if (!(await canCreateCommunityDuel(user, community))) throw new HttpError(403, 'Only community staff can create community duels.');
    }
    if (body.entryMode === 'BIDDED' && !tokenPotDuelsCreationEnabled) throw new HttpError(403, 'Token pot duels are not available yet.');

    const duel = await prisma.duel.create({
      data: {
        createdById: user.id,
        opponentId: body.entryMode === 'BIDDED' ? undefined : body.opponentId,
        communityId: body.communityId,
        visibility: body.visibility,
        ranked: body.ranked,
        entryMode: body.entryMode,
        game: body.game,
        track: body.track,
        carClass: body.carClass,
        platform: body.platform,
        crossplay: body.crossplay,
        assists: body.assists,
        damageLevel: body.damageLevel,
        raceLength: body.raceLength,
        weather: body.weather,
        rulesSummary: body.rulesSummary,
        scheduledAt: body.scheduledAt,
        expiresAt: body.expiresAt,
        startingBidTokens: body.entryMode === 'BIDDED' ? body.startingBidTokens : undefined,
        maxBidTokens: body.entryMode === 'BIDDED' ? body.maxBidTokens : undefined,
        bidClosesAt: body.entryMode === 'BIDDED' ? body.bidClosesAt : undefined,
      },
    });

    const response = jsonResponse(201, { duel });
    response.headers.set('Cache-Control', privateApiNoStore);
    return response;
  });
