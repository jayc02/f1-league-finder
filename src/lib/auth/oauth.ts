import crypto from 'node:crypto';
import type { APIContext } from 'astro';
import { HttpError } from '@/lib/utils/http';

const OAUTH_STATE_COOKIE = 'racehub_oauth_state';
const OAUTH_STATE_MAX_AGE_SECONDS = 10 * 60;

interface OAuthStatePayload {
  provider: 'google' | 'discord';
  nonce: string;
  redirectTo?: string;
}

const getStateSecret = () => {
  const secret = process.env.OAUTH_STATE_SECRET;
  if (!secret) {
    throw new HttpError(500, 'OAuth is not configured.');
  }
  return secret;
};

const toBase64Url = (value: string) => Buffer.from(value, 'utf8').toString('base64url');
const fromBase64Url = (value: string) => Buffer.from(value, 'base64url').toString('utf8');

const signPayload = (encodedPayload: string, secret: string) =>
  crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url');

export const createOAuthState = (
  context: APIContext,
  provider: OAuthStatePayload['provider'],
  redirectTo?: string,
) => {
  const payload: OAuthStatePayload = {
    provider,
    nonce: crypto.randomBytes(24).toString('base64url'),
    redirectTo: redirectTo?.startsWith('/') ? redirectTo : undefined,
  };

  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = signPayload(encodedPayload, getStateSecret());
  const stateValue = `${encodedPayload}.${signature}`;

  context.cookies.set(OAUTH_STATE_COOKIE, stateValue, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: import.meta.env.PROD,
    maxAge: OAUTH_STATE_MAX_AGE_SECONDS,
  });

  return stateValue;
};

export const validateOAuthState = (
  context: APIContext,
  provider: OAuthStatePayload['provider'],
  returnedState: string | null,
) => {
  const cookieState = context.cookies.get(OAUTH_STATE_COOKIE)?.value;
  context.cookies.delete(OAUTH_STATE_COOKIE, { path: '/' });

  if (!returnedState || !cookieState || returnedState !== cookieState) {
    throw new HttpError(400, 'Invalid OAuth state.');
  }

  const [encodedPayload, signature] = cookieState.split('.');
  if (!encodedPayload || !signature) {
    throw new HttpError(400, 'Invalid OAuth state.');
  }

  const expectedSignature = signPayload(encodedPayload, getStateSecret());
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    throw new HttpError(400, 'Invalid OAuth state.');
  }

  let payload: OAuthStatePayload;
  try {
    payload = JSON.parse(fromBase64Url(encodedPayload)) as OAuthStatePayload;
  } catch {
    throw new HttpError(400, 'Invalid OAuth state.');
  }

  if (payload.provider !== provider || !payload.nonce) {
    throw new HttpError(400, 'Invalid OAuth state.');
  }

  return payload;
};
