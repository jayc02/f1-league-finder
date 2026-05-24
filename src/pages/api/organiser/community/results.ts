import type { APIRoute } from 'astro';
import { getSessionUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { privateApiNoStore } from '@/lib/server/cache-control';
import { assertAllowedOrigin } from '@/lib/server/origin-guard';
import { submitCommunityResult } from '@/server/services/community-rating.service';

export const POST: APIRoute = async (ctx) => {
  assertAllowedOrigin(ctx.request);
  const user = await getSessionUser(ctx as never);
  const jsonHeaders = { 'content-type': 'application/json', 'cache-control': privateApiNoStore };
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: jsonHeaders });
  const body = await ctx.request.json().catch(() => null);
  if (!body?.organiserProfileId || !body?.eventName || !body?.occurredAt || !Array.isArray(body?.entries) || !body.entries.length) {
    return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400, headers: jsonHeaders });
  }
  const membership = await prisma.organiserProfileMember.findFirst({ where: { organiserProfileId: body.organiserProfileId, userId: user.id, status: 'ACTIVE' } });
  const isOwner = await prisma.organiserProfile.findFirst({ where: { id: body.organiserProfileId, userId: user.id }, select: { id: true } });
  const canSubmit = user.role === 'ADMIN' || Boolean(isOwner) || (membership && ['OWNER', 'ADMIN', 'MODERATOR'].includes(membership.role));
  if (!canSubmit) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: jsonHeaders });
  try {
    const { result, ratingEvents, updatedRatings } = await submitCommunityResult({
      ...body,
      submittedById: user.id,
      occurredAt: new Date(body.occurredAt),
      applyGlobalRating: body.applyGlobalRating === true,
      allowPlatformAdminBypass: user.role === 'ADMIN',
    });
    return new Response(JSON.stringify({ ok: true, result, ratingEvents, updatedRatings }), { status: 200, headers: jsonHeaders });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to submit community result.';
    const status = message.includes('permission') ? 403 : message.includes('not found') ? 404 : 400;
    return new Response(JSON.stringify({ error: message }), { status, headers: jsonHeaders });
  }
};
