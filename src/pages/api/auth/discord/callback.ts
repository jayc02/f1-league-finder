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
  const statePayload = validateOAuthState(context, 'discord', context.url.searchParams.get('state'));
  if (!process.env.PUBLIC_SITE_URL) {
    console.error('[auth:discord:callback] Missing required env var: PUBLIC_SITE_URL');
    throw new HttpError(500, 'OAuth is not configured.');
  }
  if (!process.env.DISCORD_OAUTH_CLIENT_ID) {
    console.error('[auth:discord:callback] Missing required env var: DISCORD_OAUTH_CLIENT_ID');
    throw new HttpError(500, 'OAuth is not configured.');
  }
  if (!process.env.DISCORD_OAUTH_CLIENT_SECRET) {
    console.error('[auth:discord:callback] Missing required env var: DISCORD_OAUTH_CLIENT_SECRET');
    throw new HttpError(500, 'OAuth is not configured.');
  }
  const redirectUri = `${process.env.PUBLIC_SITE_URL}/api/auth/discord/callback`;
  const tokenRes = await fetch('https://discord.com/api/oauth2/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code, client_id: process.env.DISCORD_OAUTH_CLIENT_ID!, client_secret: process.env.DISCORD_OAUTH_CLIENT_SECRET!, redirect_uri: redirectUri, grant_type: 'authorization_code' }) });
  if (!tokenRes.ok) throw new HttpError(400, 'Discord OAuth failed.');
  const tokenData = await tokenRes.json() as { access_token: string };
  const profileRes = await fetch('https://discord.com/api/users/@me', { headers: { Authorization: `Bearer ${tokenData.access_token}` } });
  const profile = await profileRes.json() as { id: string; email?: string; verified?: boolean; username?: string; avatar?: string };
  if (!profile.email) throw new HttpError(400, 'Discord account must expose an email.');
  if (!profile.verified) throw new HttpError(400, 'Discord account email must be verified.');
  const email = profile.email.toLowerCase();
  let authProvider = await prisma.authProvider.findUnique({ where: { provider_providerUserId: { provider: 'discord', providerUserId: profile.id } }, include: { user: true } });
  let user = authProvider?.user ?? await prisma.user.findUnique({ where: { email } });
  if (!user) user = await prisma.user.create({ data: { email, username: await generateUniqueUsername(profile.username || email), passwordHash: await hashPassword(crypto.randomBytes(32).toString('hex')) } });
  if (!authProvider) await prisma.authProvider.create({ data: { provider: 'discord', providerUserId: profile.id, userId: user.id, email, username: profile.username, avatarUrl: profile.avatar ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png` : null } });
  await createSession(user.id, context);
  return redirectResponse(statePayload.redirectTo || '/dashboard');
});
