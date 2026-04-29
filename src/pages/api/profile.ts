export const prerender = false;

import type { APIRoute } from 'astro';
import { prisma } from '@/lib/db/prisma';
import { updateProfileSchema } from '@/lib/validation/profile';
import { parseBody, withErrorHandling } from '@/lib/utils/handlers';
import { HttpError, jsonResponse } from '@/lib/utils/http';
import { removeManagedUploadIfPresent, saveUploadedImage } from '@/lib/server/upload-storage';
import { requireUser } from '@/server/permissions/authz';

export const PATCH: APIRoute = (context) =>
  withErrorHandling(async () => {
    const user = await requireUser(context);
    const contentType = context.request.headers.get('content-type') ?? '';
    let body: ReturnType<typeof updateProfileSchema.parse>;
    let nextAvatarUrl: string | null | undefined;

    if (contentType.includes('multipart/form-data')) {
      const formData = await context.request.formData();
      const avatarInput = formData.get('avatar');
      const avatarUrlInput = formData.get('avatarUrl');

      nextAvatarUrl = typeof avatarUrlInput === 'string' && avatarUrlInput.trim() ? avatarUrlInput.trim() : undefined;

      if (avatarInput instanceof File && avatarInput.size > 0) {
        nextAvatarUrl = await saveUploadedImage(avatarInput, {
          folder: 'avatars',
          maxBytes: 2 * 1024 * 1024,
          label: 'Avatar image',
        });
      }

      body = updateProfileSchema.parse({
        username: typeof formData.get('username') === 'string' ? String(formData.get('username')) : undefined,
        bio: typeof formData.get('bio') === 'string' ? String(formData.get('bio')) : null,
        region: typeof formData.get('region') === 'string' ? String(formData.get('region')) : undefined,
        preferredPlatform:
          typeof formData.get('preferredPlatform') === 'string' && String(formData.get('preferredPlatform')).length
            ? String(formData.get('preferredPlatform'))
            : null,
        avatarUrl: nextAvatarUrl ?? undefined,
      });
    } else {
      body = await parseBody(context.request, updateProfileSchema);
    }

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

    if (body.avatarUrl && body.avatarUrl !== user.avatarUrl) {
      await removeManagedUploadIfPresent(user.avatarUrl);
    }

    return jsonResponse(200, { user: updated });
  });
