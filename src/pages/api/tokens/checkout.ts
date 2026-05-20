export const prerender = false;
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { assertAllowedOrigin } from '@/lib/server/origin-guard';
import { requireUser } from '@/server/permissions/authz';
import { HttpError, jsonResponse } from '@/lib/utils/http';
import { getTokenPackById } from '@/lib/server/token-packs';

const schema = z.object({ packId: z.string().min(1) });

export const POST: APIRoute = async (context) => {
  assertAllowedOrigin(context.request);
  const user = await requireUser(context);
  const body = schema.parse(await context.request.json());
  const pack = getTokenPackById(body.packId);
  if (!pack) throw new HttpError(404, 'Token pack not found.');
  const secret = import.meta.env.STRIPE_SECRET_KEY;
  if (!secret) throw new HttpError(500, 'Stripe is not configured.');
  const base = import.meta.env.PUBLIC_SITE_URL || 'https://www.racehub.gg';

  const payload = new URLSearchParams({
    mode: 'payment',
    success_url: `${base}/tokens/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/tokens`,
    client_reference_id: user.id,
    'line_items[0][price_data][currency]': 'gbp',
    'line_items[0][price_data][product_data][name]': `${pack.label} (${pack.tokenAmount} Race Tokens)`,
    'line_items[0][price_data][unit_amount]': String(pack.priceInPence),
    'line_items[0][quantity]': '1',
    'metadata[userId]': user.id,
    'metadata[packId]': pack.packId,
    'metadata[tokenAmount]': String(pack.tokenAmount),
  });
  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', { method: 'POST', headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: payload.toString() });
  const data = await response.json();
  if (!response.ok || !data.url) throw new HttpError(502, 'Checkout session failed.');
  return jsonResponse(200, { url: data.url });
};
