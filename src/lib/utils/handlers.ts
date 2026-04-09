import { ZodError, type ZodTypeAny } from 'zod';
import { HttpError, jsonResponse } from '@/lib/utils/http';
import type { APIContext } from 'astro';

export const parseBody = async <T extends ZodTypeAny>(request: Request, schema: T) => {
  const body = await request.json().catch(() => ({}));
  return schema.parse(body);
};

export const withErrorHandling = async (fn: () => Promise<Response>) => {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof HttpError) {
      return jsonResponse(error.status, { error: error.message, details: error.details ?? null });
    }

    if (error instanceof ZodError) {
      return jsonResponse(400, {
        error: 'Validation failed.',
        details: error.flatten(),
      });
    }

    console.error(error);
    return jsonResponse(500, { error: 'Internal server error.' });
  }
};

export const getNumericLimit = (context: APIContext, defaultLimit = 20, maxLimit = 100) => {
  const limitRaw = context.url.searchParams.get('limit');
  const limit = limitRaw ? Number(limitRaw) : defaultLimit;
  if (!Number.isFinite(limit) || limit < 1) return defaultLimit;
  return Math.min(limit, maxLimit);
};
