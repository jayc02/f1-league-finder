export const prerender = false;

import type { APIRoute } from 'astro';
import { privateApiNoStore } from '@/lib/server/cache-control';
import { getNumericLimit, withErrorHandling } from '@/lib/utils/handlers';
import { jsonResponse } from '@/lib/utils/http';
import { requireUser } from '@/server/permissions/authz';
import { getProfileCommunityRankings } from '@/server/services/community-rating.service';

export const GET: APIRoute = (context) =>
  withErrorHandling(async () => {
    const user = await requireUser(context);
    const communityRankings = await getProfileCommunityRankings(user.id, getNumericLimit(context, 5, 12));
    const response = jsonResponse(200, { communityRankings });
    response.headers.set('Cache-Control', privateApiNoStore);
    return response;
  });
