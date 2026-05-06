export const prerender = false;

import type { APIRoute } from 'astro';
import { publicApiShort } from '@/lib/server/cache-control';
import { getNumericLimit, withErrorHandling } from '@/lib/utils/handlers';
import { jsonResponse } from '@/lib/utils/http';
import { getHonourLeaderboard } from '@/server/services/leaderboard.service';

export const GET: APIRoute = (context) =>
  withErrorHandling(async () => {
    const leaderboard = await getHonourLeaderboard(getNumericLimit(context, 100, 100));
    const response = jsonResponse(200, { leaderboard });
    response.headers.set('Cache-Control', publicApiShort);
    return response;
  });
