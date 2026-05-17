export const prerender = false;

import type { APIRoute } from 'astro';
import { privateApiNoStore } from '@/lib/server/cache-control';
import { withErrorHandling } from '@/lib/utils/handlers';
import { jsonResponse } from '@/lib/utils/http';
import { requireUser } from '@/server/permissions/authz';
import { getProfileOverview } from '@/server/services/profile.service';
import { withPerf } from '@/lib/utils/perf';

export const GET: APIRoute = (context) =>
  withErrorHandling(async () => {
    const user = await withPerf('profile.session', () => requireUser(context));
    const overview = await getProfileOverview(user.id);
    const response = jsonResponse(200, overview);
    response.headers.set('Cache-Control', privateApiNoStore);
    return response;
  });
