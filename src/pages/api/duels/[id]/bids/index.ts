export const prerender = false;
import type { APIRoute } from 'astro';
import { DuelBidStatus, DuelEntryMode, DuelVisibility } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { assertAllowedOrigin } from '@/lib/server/origin-guard';
import { privateApiNoStore } from '@/lib/server/cache-control';
import { withErrorHandling } from '@/lib/utils/handlers';
import { HttpError, jsonResponse } from '@/lib/utils/http';
import { requireUser } from '@/server/permissions/authz';
import { getOrCreateTokenBalance, getTokenBidIncrements, holdBidTokens, releaseBidTokens } from '@/server/services/race-token.service';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth/session';

const bidSchema = z.object({ amountTokens: z.coerce.number().int().positive() });

export const GET: APIRoute = (context) => withErrorHandling(async () => {
  const user = await getSessionUser(context);
  const duelId = context.params.id!;
  const duel = await prisma.duel.findUnique({ where: { id: duelId }, include: { bids: { orderBy: { amountTokens: 'desc' }, take: 10, include: { user: { select: { id: true, username: true } } } } } });
  if (!duel) throw new HttpError(404, 'Duel not found.');
  const currentHighestBid = duel.bids[0] ?? null;
  const increments = getTokenBidIncrements(currentHighestBid?.amountTokens ?? duel.startingBidTokens ?? 100);
  const userBalance = user ? await getOrCreateTokenBalance(user.id) : null;
  const response = jsonResponse(200, { currentHighestBid, currentLeader: currentHighestBid?.user ?? null, tokenPot: duel.tokenPot, bidClosesAt: duel.bidClosesAt, serverNow: new Date(), increments, userBid: user ? duel.bids.find((b) => b.userId === user.id) ?? null : null, userBalance, recentBids: duel.bids, canBid: true, reason: null, potRewardsEnabled: true });
  response.headers.set('Cache-Control', privateApiNoStore);
  return response;
});

export const POST: APIRoute = (context) => withErrorHandling(async () => {
  assertAllowedOrigin(context.request);
  const user = await requireUser(context);
  const duelId = context.params.id!;
  const body = bidSchema.parse(await context.request.json());
  const duel = await prisma.duel.findUnique({ where: { id: duelId }, include: { bids: { where: { status: DuelBidStatus.ACTIVE }, orderBy: { amountTokens: 'desc' }, take: 1 } } });
  if (!duel) throw new HttpError(404, 'Duel not found.');
  if (duel.entryMode !== DuelEntryMode.BIDDED) throw new HttpError(409, 'This duel does not use token bidding.');
  if (duel.createdById === user.id) throw new HttpError(403, 'Creator cannot bid on their own duel.');
  if (duel.visibility === DuelVisibility.COMMUNITY_ONLY && duel.communityId) {
    const membership = await prisma.organiserProfileMember.findUnique({ where: { organiserProfileId_userId: { organiserProfileId: duel.communityId, userId: user.id } } });
    if (!membership) throw new HttpError(403, 'Join this community before bidding.');
  }
  if (duel.bidClosesAt && duel.bidClosesAt <= new Date()) throw new HttpError(409, 'Bidding is closed.');
  const currentHighest = duel.bids[0];
  const min = currentHighest?.amountTokens ?? duel.startingBidTokens ?? 0;
  if (body.amountTokens <= min) throw new HttpError(400, 'Bid must be above the current highest bid.');

  const bid = await prisma.duelBid.create({ data: { duelId, userId: user.id, amountTokens: body.amountTokens } });
  await holdBidTokens(user.id, body.amountTokens, duelId, bid.id);
  if (currentHighest && currentHighest.userId !== user.id) {
    await prisma.duelBid.update({ where: { id: currentHighest.id }, data: { status: DuelBidStatus.OUTBID } });
    await releaseBidTokens(currentHighest.userId, currentHighest.amountTokens, duelId, currentHighest.id);
  }
  const response = jsonResponse(201, { bid });
  response.headers.set('Cache-Control', privateApiNoStore);
  return response;
});
