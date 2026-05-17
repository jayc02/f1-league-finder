export const prerender = false;

import type { APIRoute } from 'astro';
import { z } from 'zod';
import { assertAllowedOrigin } from '@/lib/server/origin-guard';
import { prisma } from '@/lib/db/prisma';
import { parseBody, withErrorHandling } from '@/lib/utils/handlers';
import { HttpError, jsonResponse } from '@/lib/utils/http';
import { requireAdmin, requireUser } from '@/server/permissions/authz';

const adminRatingUpdateSchema = z.object({
  skillRating: z.number().int().min(0).max(9999),
  honourScore: z.number().int().min(0).max(9999),
  reason: z.string().trim().min(5).max(500),
});

export const PATCH: APIRoute = (context) =>
  withErrorHandling(async () => {
    assertAllowedOrigin(context.request);
    const admin = await requireUser(context);
    requireAdmin(admin);

    const id = context.params.id;
    if (!id) throw new HttpError(400, 'User ID is required.');

    const body = await parseBody(context.request, adminRatingUpdateSchema);

    const updatedUser = await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({
        where: { id },
        select: { id: true, username: true, skillRating: true, honourScore: true },
      });
      if (!existing) throw new HttpError(404, 'User not found.');

      const skillDelta = body.skillRating - existing.skillRating;
      const honourDelta = body.honourScore - existing.honourScore;
      if (skillDelta === 0 && honourDelta === 0) throw new HttpError(400, 'At least one rating value must change.');

      const user = await tx.user.update({
        where: { id },
        data: { skillRating: body.skillRating, honourScore: body.honourScore },
        select: { id: true, username: true, role: true, honourScore: true, skillRating: true, suspensionNote: true },
      });

      await tx.moderationAction.create({
        data: {
          actionType: honourDelta !== 0 ? 'HONOUR_ADJUSTMENT' : 'WARNING',
          targetUserId: existing.id,
          adminId: admin.id,
          notes: `Admin manual rating adjustment for ${existing.username}: ${body.reason}`,
          metadata: {
            reason: body.reason,
            skillRating: { old: existing.skillRating, new: body.skillRating, delta: skillDelta },
            honourScore: { old: existing.honourScore, new: body.honourScore, delta: honourDelta },
          },
        },
      });

      if (honourDelta !== 0) {
        await tx.honourEvent.create({
          data: {
            userId: existing.id,
            type: 'ADMIN_ADJUSTMENT',
            delta: honourDelta,
            reason: body.reason,
            appliedById: admin.id,
            metadata: {
              oldHonourScore: existing.honourScore,
              newHonourScore: body.honourScore,
              oldSkillRating: existing.skillRating,
              newSkillRating: body.skillRating,
              skillRatingDelta: skillDelta,
              source: 'platform-admin-manual-adjustment',
            },
          },
        });
      }

      return user;
    });

    return jsonResponse(200, { user: updatedUser });
  });
