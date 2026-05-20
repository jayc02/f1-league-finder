export const prerender = false;
import type { APIRoute } from 'astro';
import { DuelBidStatus, DuelEntryMode, DuelStatus, DuelTokenPotStatus } from '@prisma/client';
import { assertAllowedOrigin } from '@/lib/server/origin-guard';
import { privateApiNoStore } from '@/lib/server/cache-control';
import { prisma } from '@/lib/db/prisma';
import { withErrorHandling } from '@/lib/utils/handlers';
import { HttpError, jsonResponse } from '@/lib/utils/http';
import { generateDuelCoinFlip } from '@/server/services/duel.service';
import { RaceTokenLedgerType } from '@prisma/client';

export const POST: APIRoute = (context) => withErrorHandling(async () => {
  assertAllowedOrigin(context.request);
  const duelId = context.params.id!;
  const duel = await prisma.duel.findUnique({ where: { id: duelId }, include: { bids: { where: { status: DuelBidStatus.ACTIVE }, orderBy: { amountTokens: 'desc' } } } });
  if (!duel) throw new HttpError(404, 'Duel not found.');
  if (duel.entryMode !== DuelEntryMode.BIDDED) throw new HttpError(409, 'Not a bidded duel.');
  if (duel.biddingLockedAt) return jsonResponse(200, { duel, alreadyClosed: true });
  if (!duel.bidClosesAt || duel.bidClosesAt > new Date()) throw new HttpError(409, 'Bidding has not closed yet.');
  const winningBid = duel.bids[0];
  if (!winningBid) {
    const expired = await prisma.duel.update({ where: { id: duelId }, data: { status: DuelStatus.EXPIRED, biddingLockedAt: new Date() } });
    return jsonResponse(200, { duel: expired, noBids: true });
  }
  const flip = generateDuelCoinFlip(duel.createdById, winningBid.userId);
  const updated = await prisma.$transaction(async (tx) => {
    await tx.duelBid.update({ where: { id: winningBid.id }, data: { status: DuelBidStatus.WON_SEAT } });
    await tx.raceTokenBalance.update({ where: { userId: winningBid.userId }, data: { held: { decrement: winningBid.amountTokens }, lifetimeSpent: { increment: winningBid.amountTokens } } });
    await tx.raceTokenLedger.create({ data: { userId: winningBid.userId, amount: -winningBid.amountTokens, type: RaceTokenLedgerType.BID_TO_POT, reason: 'Winning bid moved to token pot', duelId, bidId: winningBid.id } });
    await tx.duelBid.update({ where: { id: winningBid.id }, data: { status: DuelBidStatus.MOVED_TO_POT } });
    for (const bid of duel.bids.slice(1)) {
      await tx.duelBid.update({ where: { id: bid.id }, data: { status: DuelBidStatus.RELEASED } });
      await tx.raceTokenBalance.update({ where: { userId: bid.userId }, data: { held: { decrement: bid.amountTokens }, available: { increment: bid.amountTokens } } });
      await tx.raceTokenLedger.create({ data: { userId: bid.userId, amount: bid.amountTokens, type: RaceTokenLedgerType.BID_RELEASE, reason: 'Bid release', duelId, bidId: bid.id } });
    }
    return tx.duel.update({ where: { id: duelId }, data: { opponentId: winningBid.userId, winningBidId: winningBid.id, biddingLockedAt: new Date(), tokenPot: { increment: winningBid.amountTokens }, tokenPotStatus: DuelTokenPotStatus.HOLDING, status: DuelStatus.ACCEPTED, coinFlipValue: flip.value, coinFlipWinnerUserId: flip.winnerUserId, leg1AdvantageUserId: flip.leg1AdvantageUserId, leg2AdvantageUserId: flip.leg2AdvantageUserId, legs: { create: [{ legNumber: 1, advantageUserId: flip.leg1AdvantageUserId }, { legNumber: 2, advantageUserId: flip.leg2AdvantageUserId }] } } });
  });
  const response = jsonResponse(200, { duel: updated });
  response.headers.set('Cache-Control', privateApiNoStore);
  return response;
});
