import type { AstroGlobal } from 'astro';

interface ApiFailure {
  error: string;
  details?: unknown;
}

export async function fetchFromApi<T>(Astro: AstroGlobal, path: string, init?: RequestInit): Promise<T> {
  const origin = Astro.url.origin;
  const response = await fetch(new URL(path, origin), {
    ...init,
    headers: {
      cookie: Astro.request.headers.get('cookie') ?? '',
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json().catch(() => ({}))) as T & ApiFailure;
  if (!response.ok) {
    throw new Error(payload.error ?? 'Request failed');
  }

  return payload;
}
