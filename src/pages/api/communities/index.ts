export const prerender = false;

import type { APIRoute } from 'astro';
import { publicApiShort } from '@/lib/server/cache-control';
import { getPublicCommunitySummaries } from '@/server/services/community.service';
import { getNumericLimit, withErrorHandling } from '@/lib/utils/handlers';
import { jsonResponse } from '@/lib/utils/http';

export const GET: APIRoute = (context) =>
  withErrorHandling(async () => {
    const q = context.url.searchParams.get('q')?.trim();
    const region = context.url.searchParams.get('region');
    const featuredOnly = context.url.searchParams.get('featured') === '1';

    const communities = await getPublicCommunitySummaries({
      limit: getNumericLimit(context, 30, 100),
      q,
      region,
      featuredOnly,
    });

    const response = jsonResponse(200, { communities });
    response.headers.set('Cache-Control', publicApiShort);
    return response;
  });
