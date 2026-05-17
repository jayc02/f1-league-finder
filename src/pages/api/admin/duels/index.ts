export const prerender = false;

import type { APIRoute } from 'astro';
import { privateApiNoStore } from '@/lib/server/cache-control';
import { getNumericLimit, withErrorHandling } from '@/lib/utils/handlers';
import { jsonResponse } from '@/lib/utils/http';
import { requirePlatformAdmin } from '@/lib/server/community-permissions';
import { getAdminDuelQueue } from '@/server/services/duel.service';

export const GET: APIRoute = (context) =>
  withErrorHandling(async () => {
    await requirePlatformAdmin(context);
    const duels = await getAdminDuelQueue(getNumericLimit(context, 50, 100));
    const response = jsonResponse(200, { duels });
    response.headers.set('Cache-Control', privateApiNoStore);
    return response;
  });
