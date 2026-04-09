export const prerender = false;

import type { APIRoute } from 'astro';
import { getNumericLimit, withErrorHandling } from '@/lib/utils/handlers';
import { jsonResponse } from '@/lib/utils/http';
import { getHonourLeaderboard } from '@/server/services/leaderboard.service';

export const GET: APIRoute = (context) =>
  withErrorHandling(async () => {
    const leaderboard = await getHonourLeaderboard(getNumericLimit(context, 50, 100));
    return jsonResponse(200, { leaderboard });
  });
