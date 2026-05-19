export const prerender = false;
import crypto from 'node:crypto';
import type { APIRoute } from 'astro';
import { prisma } from '@/lib/db/prisma';
import { validateOAuthState } from '@/lib/auth/oauth';
import { createSession } from '@/lib/auth/session';
import { generateUniqueUsername } from '@/lib/auth/oauth-users';
import { withErrorHandling } from '@/lib/utils/handlers';
import { HttpError } from '@/lib/utils/http';
import { hashPassword } from '@/lib/auth/password';
import { redirectResponse } from '@/lib/auth/http';

export const GET: APIRoute = (context) => withErrorHandling(async () => {
  const code = context.url.searchParams.get('code');
  if (!code) throw new HttpError(400, 'Missing OAuth code.');
  const statePayload = validateOAuthState(context, 'google', context.url.searchParams.get('state'));
  if (!process.env.PUBLIC_SITE_URL) {
    console.error('[auth:google:callback] Missing required env var: PUBLIC_SITE_URL');
    throw new HttpError(500, 'OAuth is not configured.');
  }
  if (!process.env.GOOGLE_OAUTH_CLIENT_ID) {
    console.error('[auth:google:callback] Missing required env var: GOOGLE_OAUTH_CLIENT_ID');
    throw new HttpError(500, 'OAuth is not configured.');
  }
  if (!process.env.GOOGLE_OAUTH_CLIENT_SECRET) {
    console.error('[auth:google:callback] Missing required env var: GOOGLE_OAUTH_CLIENT_SECRET');
    throw new HttpError(500, 'OAuth is not configured.');
  }
  const redirectUri = `${process.env.PUBLIC_SITE_URL}/api/auth/google/callback`;
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code, client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!, client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!, redirect_uri: redirectUri, grant_type: 'authorization_code' }) });
  if (!tokenRes.ok) throw new HttpError(400, 'Google OAuth failed.');
  const tokenData = await tokenRes.json() as { access_token: string };
  const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: `Bearer ${tokenData.access_token}` } });
  const profile = await profileRes.json() as { sub: string; email?: string; email_verified?: boolean; name?: string; picture?: string };
  if (!profile.email || !profile.email_verified) throw new HttpError(400, 'Google account requires a verified email.');
  const email = profile.email.toLowerCase();
  let authProvider = await prisma.authProvider.findUnique({ where: { provider_providerUserId: { provider: 'google', providerUserId: profile.sub } }, include: { user: true } });
  let user = authProvider?.user ?? await prisma.user.findUnique({ where: { email } });
  if (!user) user = await prisma.user.create({ data: { email, username: await generateUniqueUsername(profile.name || email), passwordHash: await hashPassword(crypto.randomBytes(32).toString('hex')) } });
  if (!authProvider) {
    await prisma.authProvider.create({ data: { provider: 'google', providerUserId: profile.sub, userId: user.id, email, username: profile.name, avatarUrl: profile.picture } });
  }
  await createSession(user.id, context);
  return redirectResponse(statePayload.redirectTo || '/dashboard');
});
