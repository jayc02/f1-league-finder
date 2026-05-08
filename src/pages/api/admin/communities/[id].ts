export const prerender = false;

import type { APIRoute } from 'astro';
import { assertAllowedOrigin } from '@/lib/server/origin-guard';
import { prisma } from '@/lib/db/prisma';
import { adminCommunitySchema } from '@/lib/validation/admin';
import { parseBody, withErrorHandling } from '@/lib/utils/handlers';
import { HttpError, jsonResponse } from '@/lib/utils/http';
import { requireAdmin, requireUser } from '@/server/permissions/authz';

export const PATCH: APIRoute = (context) =>
  withErrorHandling(async () => {
    assertAllowedOrigin(context.request);
    const admin = await requireUser(context);
    requireAdmin(admin);

    const id = context.params.id;
    if (!id) throw new HttpError(400, 'Community ID is required.');

    const body = await parseBody(context.request, adminCommunitySchema);

    const community = await prisma.organiserProfile.update({ where: { id }, data: body, include: { user: true } });

    await prisma.moderationAction.create({
      data: {
        actionType: 'WARNING',
        targetUserId: community.userId,
        adminId: admin.id,
        notes: `Admin updated community ${community.displayName}`,
        metadata: body,
      },
    });

    return jsonResponse(200, { community });
  });

export const DELETE: APIRoute = (context) =>
  withErrorHandling(async () => {
    assertAllowedOrigin(context.request);
    const admin = await requireUser(context);
    requireAdmin(admin);

    const id = context.params.id;
    if (!id) throw new HttpError(400, 'Community ID is required.');

    const community = await prisma.organiserProfile.findUnique({ where: { id }, select: { id: true, displayName: true, userId: true } });
    if (!community) throw new HttpError(404, 'Community not found.');

    await prisma.organiserProfile.delete({ where: { id } });

    await prisma.moderationAction.create({
      data: {
        actionType: 'WARNING',
        targetUserId: community.userId,
        adminId: admin.id,
        notes: `Admin removed community ${community.displayName}`,
        metadata: { communityId: community.id, removed: true },
      },
    });

    return jsonResponse(200, { ok: true });
  });
