export const prerender = false;
import type { APIRoute } from 'astro';
import { privateApiNoStore } from '@/lib/server/cache-control';
import { jsonResponse } from '@/lib/utils/http';
import { withErrorHandling } from '@/lib/utils/handlers';
import { requireUser } from '@/server/permissions/authz';
import { getOrCreateTokenBalance } from '@/server/services/race-token.service';

export const GET: APIRoute = (context) => withErrorHandling(async () => {
  const user = await requireUser(context);
  const balance = await getOrCreateTokenBalance(user.id);
  const res = jsonResponse(200, { balance });
  res.headers.set('Cache-Control', privateApiNoStore);
  return res;
});
