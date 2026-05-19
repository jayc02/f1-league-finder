export const prerender = false;
import crypto from 'node:crypto';
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { assertAllowedOrigin } from '@/lib/server/origin-guard';
import { prisma } from '@/lib/db/prisma';
import { parseBody, withErrorHandling } from '@/lib/utils/handlers';
import { jsonResponse } from '@/lib/utils/http';
import { sendPlatformEmail } from '@/server/services/email.service';

const schema = z.object({ email: z.string().email() });
const message = 'If an account exists for that email, a reset link has been sent.';

export const POST: APIRoute = (context) => withErrorHandling(async () => {
  assertAllowedOrigin(context.request);
  const body = await parseBody(context.request, schema);
  const email = body.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true } });

  if (user) {
    const rawToken = crypto.randomBytes(48).toString('base64url');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await prisma.passwordResetToken.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } });
    await prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt } });

    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
      console.warn('Missing email provider config for password reset emails.');
      return jsonResponse(500, { error: 'Unable to send reset email at this time.' });
    }

    const site = process.env.PUBLIC_SITE_URL;
    await sendPlatformEmail({
      to: user.email,
      subject: 'Reset your RaceHub password',
      text: `Someone requested a password reset for your RaceHub account. This link expires in 30 minutes. If this was not you, ignore this email.\n\n${site}/reset-password?token=${rawToken}`,
    });
  }

  return jsonResponse(200, { message });
});
