export const prerender = false;
import type { APIRoute } from 'astro';
import { prisma } from '@/lib/db/prisma';
import { RaceTokenLedgerType } from '@prisma/client';
import { getOrCreateTokenBalance } from '@/server/services/race-token.service';

const textEncoder = new TextEncoder();
const secureCompare = (a: string, b: string) => {
  const aa = textEncoder.encode(a); const bb = textEncoder.encode(b);
  if (aa.length !== bb.length) return false;
  let out = 0; for (let i = 0; i < aa.length; i += 1) out |= aa[i] ^ bb[i];
  return out === 0;
};

export const POST: APIRoute = async ({ request }) => {
  const signature = request.headers.get('stripe-signature');
  const secret = import.meta.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) return new Response('Invalid signature', { status: 400 });
  const rawBody = await request.text();
  const crypto = await import('node:crypto');
  const expected = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
  const provided = signature.split(',').find((part) => part.startsWith('v1='))?.slice(3) ?? '';
  if (!secureCompare(expected, provided)) return new Response('Bad signature', { status: 400 });

  const event = JSON.parse(rawBody) as any;
  if (event.type !== 'checkout.session.completed') return new Response('ok');
  const session = event.data?.object;
  const userId = session?.metadata?.userId as string | undefined;
  const tokenAmount = Number(session?.metadata?.tokenAmount ?? 0);
  const packId = session?.metadata?.packId as string | undefined;
  const stripeSessionId = session?.id as string | undefined;
  if (!userId || !packId || !stripeSessionId || !Number.isInteger(tokenAmount) || tokenAmount <= 0) return new Response('ok');

  await prisma.$transaction(async (tx) => {
    const existing = await tx.raceTokenLedger.findFirst({ where: { type: RaceTokenLedgerType.PURCHASE, metadata: { path: ['stripeSessionId'], equals: stripeSessionId } } as any });
    if (existing) return;
    await getOrCreateTokenBalance(userId, tx);
    await tx.raceTokenBalance.update({ where: { userId }, data: { available: { increment: tokenAmount }, lifetimeEarned: { increment: tokenAmount } } });
    await tx.raceTokenLedger.create({ data: { userId, amount: tokenAmount, type: RaceTokenLedgerType.PURCHASE, reason: `Token purchase (${packId})`, metadata: { stripeSessionId, packId } } });
  });
  return new Response('ok');
};
