import type { APIRoute } from 'astro';
import { destroySession } from '@/lib/auth/session';
import { jsonResponse } from '@/lib/utils/http';

export const POST: APIRoute = async (context) => {
  await destroySession(context);
  return jsonResponse(200, { ok: true });
};
