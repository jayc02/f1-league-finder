import type { APIRoute } from 'astro';
import { getSessionUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { submitCommunityResult } from '@/server/services/community-rating.service';

export const POST: APIRoute = async (ctx) => {
  const user = await getSessionUser(ctx as never);
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const body = await ctx.request.json().catch(() => null);
  if (!body?.organiserProfileId || !body?.eventName || !body?.occurredAt || !Array.isArray(body?.entries) || !body.entries.length) {
    return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });
  }
  const membership = await prisma.organiserProfileMember.findFirst({ where: { organiserProfileId: body.organiserProfileId, userId: user.id, status: 'ACTIVE' } });
  const isOwner = await prisma.organiserProfile.findFirst({ where: { id: body.organiserProfileId, userId: user.id }, select: { id: true } });
  const canSubmit = user.role === 'ADMIN' || Boolean(isOwner) || (membership && ['OWNER', 'ADMIN', 'MODERATOR'].includes(membership.role));
  if (!canSubmit) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  const result = await submitCommunityResult({ ...body, submittedById: user.id, occurredAt: new Date(body.occurredAt) });
  return new Response(JSON.stringify({ ok: true, ...result }), { status: 200 });
};
