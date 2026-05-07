export const prerender = false;

import type { APIRoute } from 'astro';
import { privateApiNoStore } from '@/lib/server/cache-control';
import { getSessionNavUser } from '@/lib/auth/session';
import { jsonResponse } from '@/lib/utils/http';

const withPrivateNoStore = (response: Response) => {
  response.headers.set('Cache-Control', privateApiNoStore);
  return response;
};

export const GET: APIRoute = async (context) => {
  try {
    const user = await getSessionNavUser(context);
    return withPrivateNoStore(jsonResponse(200, { user }));
  } catch (error) {
    console.error('Failed to resolve navigation auth state.', error);
    return withPrivateNoStore(jsonResponse(200, { user: null }));
  }
};
