export const prerender = false;

import type { APIRoute } from 'astro';
import { prisma } from '@/lib/db/prisma';
import { updateProfileSchema } from '@/lib/validation/profile';
import { parseBody, withErrorHandling } from '@/lib/utils/handlers';
import { HttpError, jsonResponse } from '@/lib/utils/http';
import { requireUser } from '@/server/permissions/authz';

export const PATCH: APIRoute = (context) =>
  withErrorHandling(async () => {
    const user = await requireUser(context);
    const body = await parseBody(context.request, updateProfileSchema);

    if (body.username && body.username !== user.username) {
      const existing = await prisma.user.findFirst({
        where: {
          username: body.username,
          id: { not: user.id },
        },
        select: { id: true },
      });

      if (existing) throw new HttpError(409, 'Username is already taken.');
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(body.username ? { username: body.username } : {}),
        ...(body.bio !== undefined ? { bio: body.bio } : {}),
        ...(body.region ? { region: body.region } : {}),
        ...(body.preferredPlatform !== undefined ? { preferredPlatform: body.preferredPlatform } : {}),
        ...(body.avatarUrl !== undefined ? { avatarUrl: body.avatarUrl } : {}),
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        honourScore: true,
        skillRating: true,
        region: true,
        preferredPlatform: true,
        bio: true,
        avatarUrl: true,
      },
    });

    return jsonResponse(200, { user: updated });
  });
