import type { APIRoute } from 'astro';
import { getNumericLimit, withErrorHandling } from '@/lib/utils/handlers';
import { jsonResponse } from '@/lib/utils/http';
import { getGlobalSkillLeaderboard } from '@/server/services/leaderboard.service';

export const GET: APIRoute = (context) =>
  withErrorHandling(async () => {
    const leaderboard = await getGlobalSkillLeaderboard(getNumericLimit(context, 50, 100));
    return jsonResponse(200, { leaderboard });
  });
