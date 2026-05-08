import { HttpError } from '@/lib/utils/http';

const MUTATION_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);
const DEFAULT_ALLOWED_ORIGINS = ['https://racehub.gg', 'https://www.racehub.gg'];

const normalizeOrigin = (value: string | null | undefined) => {
  if (!value) return null;

  try {
    const url = new URL(value.trim().replace(/\/+$/, ''));
    return url.origin;
  } catch {
    return null;
  }
};

const getConfiguredAllowedOrigins = () => {
  const values = [
    process.env.PUBLIC_SITE_URL,
    ...DEFAULT_ALLOWED_ORIGINS,
    ...(process.env.PUBLIC_ALLOWED_ORIGINS?.split(',') ?? []),
  ];

  return values.map(normalizeOrigin).filter((origin): origin is string => Boolean(origin));
};

const logBlockedOrigin = (origin: string | null, referer: string | null, requestOrigin: string | null) => {
  console.warn('blocked mutation request: invalid origin', {
    origin: normalizeOrigin(origin),
    referer: normalizeOrigin(referer),
    requestOrigin,
  });
};

export const assertAllowedOrigin = (request: Request) => {
  if (!MUTATION_METHODS.has(request.method.toUpperCase())) return;

  const requestOrigin = normalizeOrigin(request.url);
  const originHeader = request.headers.get('origin');
  const refererHeader = request.headers.get('referer');
  const submittedOrigin = normalizeOrigin(originHeader) ?? normalizeOrigin(refererHeader);
  const allowedOrigins = new Set([requestOrigin, ...getConfiguredAllowedOrigins()].filter((origin): origin is string => Boolean(origin)));

  if (!submittedOrigin || !allowedOrigins.has(submittedOrigin)) {
    logBlockedOrigin(originHeader, refererHeader, requestOrigin);
    throw new HttpError(403, 'Invalid request origin.');
  }
};
