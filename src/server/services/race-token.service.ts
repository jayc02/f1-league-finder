import { Prisma, RaceTokenLedgerType } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { HttpError } from '@/lib/utils/http';

const ensurePositive = (amount: number) => {
  if (!Number.isInteger(amount) || amount <= 0) throw new HttpError(400, 'Amount must be a positive integer.');
};

export const getOrCreateTokenBalance = async (userId: string, tx: Prisma.TransactionClient | PrismaClientLike = prisma) => {
  return tx.raceTokenBalance.upsert({ where: { userId }, update: {}, create: { userId } });
};

type PrismaClientLike = Prisma.TransactionClient | typeof prisma;

const createLedger = (tx: PrismaClientLike, input: { userId: string; amount: number; type: RaceTokenLedgerType; reason: string; duelId?: string; bidId?: string; metadata?: Prisma.InputJsonValue }) =>
  tx.raceTokenLedger.create({ data: input });

export const grantDemoTokens = async (userId: string, amount: number, reason: string) => {
  ensurePositive(amount);
  return prisma.$transaction(async (tx) => {
    await getOrCreateTokenBalance(userId, tx);
    await tx.raceTokenBalance.update({ where: { userId }, data: { available: { increment: amount }, lifetimeEarned: { increment: amount } } });
    await createLedger(tx, { userId, amount, type: RaceTokenLedgerType.DEMO_GRANT, reason });
  });
};

export const adminAdjustTokens = async (userId: string, amount: number, reason: string, adminId: string) => prisma.$transaction(async (tx) => {
  await getOrCreateTokenBalance(userId, tx);
  const balance = await tx.raceTokenBalance.findUniqueOrThrow({ where: { userId } });
  if (amount < 0 && balance.available < Math.abs(amount)) throw new HttpError(409, 'Insufficient available balance.');
  await tx.raceTokenBalance.update({ where: { userId }, data: { available: { increment: amount }, lifetimeEarned: amount > 0 ? { increment: amount } : undefined, lifetimeSpent: amount < 0 ? { increment: Math.abs(amount) } : undefined } });
  await createLedger(tx, { userId, amount, type: amount >= 0 ? RaceTokenLedgerType.ADMIN_GRANT : RaceTokenLedgerType.ADMIN_DEBIT, reason, metadata: { adminId } });
});

export const holdBidTokens = async (userId: string, amount: number, duelId: string, bidId: string) => prisma.$transaction(async (tx) => {
  ensurePositive(amount);
  await getOrCreateTokenBalance(userId, tx);
  const bal = await tx.raceTokenBalance.findUniqueOrThrow({ where: { userId } });
  if (bal.available < amount) throw new HttpError(409, 'Insufficient Race Tokens.');
  await tx.raceTokenBalance.update({ where: { userId }, data: { available: { decrement: amount }, held: { increment: amount } } });
  await createLedger(tx, { userId, amount: -amount, type: RaceTokenLedgerType.BID_HOLD, reason: 'Bid hold', duelId, bidId });
});

export const releaseBidTokens = async (userId: string, amount: number, duelId: string, bidId: string) => prisma.$transaction(async (tx) => {
  ensurePositive(amount);
  const bal = await tx.raceTokenBalance.findUniqueOrThrow({ where: { userId } });
  if (bal.held < amount) throw new HttpError(409, 'Held balance too low.');
  await tx.raceTokenBalance.update({ where: { userId }, data: { held: { decrement: amount }, available: { increment: amount } } });
  await createLedger(tx, { userId, amount, type: RaceTokenLedgerType.BID_RELEASE, reason: 'Bid release', duelId, bidId });
});

export const moveWinningBidToPot = async (userId: string, amount: number, duelId: string, bidId: string) => prisma.$transaction(async (tx) => {
  ensurePositive(amount);
  const bal = await tx.raceTokenBalance.findUniqueOrThrow({ where: { userId } });
  if (bal.held < amount) throw new HttpError(409, 'Held balance too low.');
  await tx.raceTokenBalance.update({ where: { userId }, data: { held: { decrement: amount }, lifetimeSpent: { increment: amount } } });
  await createLedger(tx, { userId, amount: -amount, type: RaceTokenLedgerType.BID_TO_POT, reason: 'Winning bid moved to token pot', duelId, bidId });
});

export const awardTokenPot = async (winnerUserId: string, amount: number, duelId: string) => grantDemoTokens(winnerUserId, amount, `Token pot award (${duelId})`);
export const refundTokenPot = async (userId: string, amount: number, duelId: string, reason: string) => grantDemoTokens(userId, amount, `${reason} (${duelId})`);

export const getTokenBidIncrements = (currentBidTokens: number) => {
  const round5 = (value: number) => Math.round(value / 5) * 5;
  return {
    small: Math.max(5, round5(currentBidTokens * 0.05)),
    medium: Math.max(10, round5(currentBidTokens * 0.1)),
    big: Math.max(50, round5(currentBidTokens * 0.5)),
  };
};
