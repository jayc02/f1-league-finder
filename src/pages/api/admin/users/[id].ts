export const prerender = false;

import type { APIRoute } from 'astro';
import { assertAllowedOrigin } from '@/lib/server/origin-guard';
import { prisma } from '@/lib/db/prisma';
import { adminUpdateUserSchema } from '@/lib/validation/admin';
import { parseBody, withErrorHandling } from '@/lib/utils/handlers';
import { HttpError, jsonResponse } from '@/lib/utils/http';
import { requireAdmin, requireUser } from '@/server/permissions/authz';

export const PATCH: APIRoute = (context) =>
  withErrorHandling(async () => {
    assertAllowedOrigin(context.request);
    const admin = await requireUser(context);
    requireAdmin(admin);

    const id = context.params.id;
    if (!id) throw new HttpError(400, 'User ID is required.');

    const body = await parseBody(context.request, adminUpdateUserSchema);

    const user = await prisma.user.update({
      where: { id },
      data: body,
      select: {
        id: true,
        username: true,
        role: true,
        honourScore: true,
        skillRating: true,
        suspensionNote: true,
      },
    });

    await prisma.moderationAction.create({
      data: {
        actionType: body.suspensionNote ? 'SUSPENSION_NOTE' : 'WARNING',
        targetUserId: user.id,
        adminId: admin.id,
        notes: `Admin updated user ${user.username}`,
        metadata: body,
      },
    });

    return jsonResponse(200, { user });
  });
