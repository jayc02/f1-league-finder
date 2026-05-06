export const prerender = false;

import type { APIRoute } from 'astro';
import { privateApiNoStore } from '@/lib/server/cache-control';
import { getSessionUser } from '@/lib/auth/session';
import { jsonResponse } from '@/lib/utils/http';

export const GET: APIRoute = async (context) => {
  const user = await getSessionUser(context);
  if (!user) {
    const response = jsonResponse(200, { user: null });
    response.headers.set('Cache-Control', privateApiNoStore);
    return response;
  }

  const response = jsonResponse(200, {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      honourScore: user.honourScore,
      skillRating: user.skillRating,
      region: user.region,
      preferredPlatform: user.preferredPlatform,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
    },
  });
  response.headers.set('Cache-Control', privateApiNoStore);
  return response;
};
