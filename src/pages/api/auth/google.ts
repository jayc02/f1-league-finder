export const prerender = false;
import type { APIRoute } from 'astro';
import { createOAuthState } from '@/lib/auth/oauth';
import { withErrorHandling } from '@/lib/utils/handlers';
import { HttpError } from '@/lib/utils/http';
import { redirectResponse } from '@/lib/auth/http';

export const GET: APIRoute = (context) => withErrorHandling(async () => {
  if (!process.env.GOOGLE_OAUTH_CLIENT_ID) throw new HttpError(500, 'Google OAuth is not configured.');
  const redirectTo = context.url.searchParams.get('redirectTo') ?? undefined;
  const state = createOAuthState(context, 'google', redirectTo);
  const redirectUri = `${process.env.PUBLIC_SITE_URL}/api/auth/google/callback`;
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', process.env.GOOGLE_OAUTH_CLIENT_ID);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('state', state);
  return redirectResponse(url);
});
