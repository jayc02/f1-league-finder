export const prerender = false;

import type { APIRoute } from 'astro';
import { assertAllowedOrigin } from '@/lib/server/origin-guard';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { registerSchema } from '@/lib/validation/auth';
import { parseBody, withErrorHandling } from '@/lib/utils/handlers';
import { HttpError, jsonResponse } from '@/lib/utils/http';
import { hashPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';

export const POST: APIRoute = (context) =>
  withErrorHandling(async () => {
    assertAllowedOrigin(context.request);
    const body = await parseBody(context.request, registerSchema);

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: body.email.toLowerCase() }, { username: body.username }],
      },
    });
    if (existing) throw new HttpError(409, 'User with this email or username already exists.');

    const passwordHash = await hashPassword(body.password);
    const user = await prisma.user.create({
      data: {
        username: body.username,
        email: body.email.toLowerCase(),
        passwordHash,
        preferredPlatform: body.preferredPlatform,
        region: body.region,
        role: Role.PLAYER,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        honourScore: true,
        skillRating: true,
      },
    });

    await createSession(user.id, context);
    return jsonResponse(201, { user });
  });
