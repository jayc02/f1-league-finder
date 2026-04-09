import type { APIRoute } from 'astro';
import { prisma } from '@/lib/db/prisma';
import { loginSchema } from '@/lib/validation/auth';
import { parseBody, withErrorHandling } from '@/lib/utils/handlers';
import { HttpError, jsonResponse } from '@/lib/utils/http';
import { verifyPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';

export const POST: APIRoute = (context) =>
  withErrorHandling(async () => {
    const body = await parseBody(context.request, loginSchema);

    const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      throw new HttpError(401, 'Invalid credentials.');
    }

    await createSession(user.id, context);

    return jsonResponse(200, {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        honourScore: user.honourScore,
        skillRating: user.skillRating,
      },
    });
  });
