export const prerender = false;
import crypto from 'node:crypto';
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { assertAllowedOrigin } from '@/lib/server/origin-guard';
import { prisma } from '@/lib/db/prisma';
import { parseBody, withErrorHandling } from '@/lib/utils/handlers';
import { HttpError, jsonResponse } from '@/lib/utils/http';
import { hashPassword } from '@/lib/auth/password';

const schema = z.object({ token: z.string().min(16), password: z.string().min(8).max(128), confirmPassword: z.string().min(8).max(128) });

export const POST: APIRoute = (context) => withErrorHandling(async () => {
  assertAllowedOrigin(context.request);
  const body = await parseBody(context.request, schema);
  if (body.password !== body.confirmPassword) throw new HttpError(400, 'Passwords do not match.');

  const tokenHash = crypto.createHash('sha256').update(body.token).digest('hex');
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!record || record.usedAt || record.expiresAt.getTime() <= Date.now()) throw new HttpError(400, 'Invalid or expired reset token.');

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: record.userId }, data: { passwordHash: await hashPassword(body.password) } });
    await tx.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
    await tx.session.deleteMany({ where: { userId: record.userId } });
  });

  return jsonResponse(200, { ok: true });
});
