export const prerender = false;

import type { APIRoute } from 'astro';
import { privateApiNoStore } from '@/lib/server/cache-control';
import { getSessionUser } from '@/lib/auth/session';
import { getDuelForViewer } from '@/server/services/duel.service';
import { withErrorHandling } from '@/lib/utils/handlers';
import { HttpError, jsonResponse } from '@/lib/utils/http';

export const GET: APIRoute = (context) =>
  withErrorHandling(async () => {
    const id = context.params.id;
    if (!id) throw new HttpError(400, 'Duel id is required.');
    const user = await getSessionUser(context);
    const result = await getDuelForViewer(id, user?.id);
    if (result.status === 'not_found') throw new HttpError(404, 'Duel not found.');
    if (result.status === 'access_denied') throw new HttpError(403, result.message);
    const response = jsonResponse(200, { duel: result.duel });
    response.headers.set('Cache-Control', privateApiNoStore);
    return response;
  });
