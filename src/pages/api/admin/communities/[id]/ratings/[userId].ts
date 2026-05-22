export const prerender = false;
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { assertAllowedOrigin } from '@/lib/server/origin-guard';
import { prisma } from '@/lib/db/prisma';
import { parseBody, withErrorHandling } from '@/lib/utils/handlers';
import { HttpError, jsonResponse } from '@/lib/utils/http';
import { requireAdmin, requireUser } from '@/server/permissions/authz';

const schema = z.object({
  skillRating: z.number().int().min(0).max(9999).optional(),
  honourScore: z.number().int().min(0).max(9999).optional(),
  reason: z.string().trim().min(5).max(500),
});

export const PATCH: APIRoute = (context) => withErrorHandling(async () => {
  assertAllowedOrigin(context.request);
  const admin = await requireUser(context);
  requireAdmin(admin);
  const organiserProfileId = context.params.id;
  const userId = context.params.userId;
  if (!organiserProfileId || !userId) throw new HttpError(400, 'IDs required.');
  const body = await parseBody(context.request, schema);

  const result = await prisma.$transaction(async (tx) => {
    const current = await tx.communityDriverRating.upsert({ where: { organiserProfileId_userId: { organiserProfileId, userId } }, update: {}, create: { organiserProfileId, userId } });
    const nextSkill = body.skillRating ?? current.skillRating;
    const nextHonour = body.honourScore ?? current.honourScore;
    const skillDelta = nextSkill - current.skillRating;
    const honourDelta = nextHonour - current.honourScore;
    if (!skillDelta && !honourDelta) throw new HttpError(400, 'No rating changes provided.');
    const updated = await tx.communityDriverRating.update({ where: { id: current.id }, data: { skillRating: nextSkill, honourScore: nextHonour } });
    await tx.communityRatingEvent.create({ data: { organiserProfileId, userId, appliedById: admin.id, skillDelta, honourDelta, reason: `Admin correction: ${body.reason}`, metadata: { reason: body.reason, source: 'platform-admin-community-adjustment' } } });
    return updated;
  });

  return jsonResponse(200, { rating: result }, { 'Cache-Control': 'private, no-store' });
});
