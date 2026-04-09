import { apiFetch } from './client';

export class ApiClientError extends Error {
  details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.details = details;
  }
}

export async function apiRequest<T>(input: string, init?: RequestInit): Promise<T> {
  try {
    return await apiFetch<T>(input, {
      credentials: 'include',
      ...init,
    });
  } catch (error) {
    throw new ApiClientError(error instanceof Error ? error.message : 'Request failed');
  }
}
