export type ApiSuccess<T> = T & { error?: never };
export type ApiFailure = { error: string; details?: unknown };

export async function apiFetch<T>(input: RequestInfo | URL, init?: RequestInit): Promise<ApiSuccess<T>> {
  const response = await fetch(input, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json().catch(() => ({}))) as ApiSuccess<T> | ApiFailure;
  if (!response.ok) {
    const error = (payload as ApiFailure).error ?? 'Request failed';
    throw new Error(error);
  }

  return payload as ApiSuccess<T>;
}
