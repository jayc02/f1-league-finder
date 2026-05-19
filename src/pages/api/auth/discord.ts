export const prerender = false;
import type { APIRoute } from 'astro';
import { createOAuthState } from '@/lib/auth/oauth';
import { withErrorHandling } from '@/lib/utils/handlers';
import { HttpError } from '@/lib/utils/http';

export const GET: APIRoute = (context) => withErrorHandling(async () => {
  if (!process.env.DISCORD_OAUTH_CLIENT_ID) throw new HttpError(500, 'Discord OAuth is not configured.');
  const state = createOAuthState(context, 'discord', context.url.searchParams.get('redirectTo') ?? undefined);
  const redirectUri = `${process.env.PUBLIC_SITE_URL}/api/auth/discord/callback`;
  const url = new URL('https://discord.com/oauth2/authorize');
  url.searchParams.set('client_id', process.env.DISCORD_OAUTH_CLIENT_ID);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'identify email');
  url.searchParams.set('state', state);
  return Response.redirect(url.toString(), 302);
});
