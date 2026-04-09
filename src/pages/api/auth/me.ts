import type { APIRoute } from 'astro';
import { getSessionUser } from '@/lib/auth/session';
import { jsonResponse } from '@/lib/utils/http';

export const GET: APIRoute = async (context) => {
  const user = await getSessionUser(context);
  if (!user) return jsonResponse(200, { user: null });

  return jsonResponse(200, {
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
};
