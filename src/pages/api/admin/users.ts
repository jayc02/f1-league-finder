export const prerender = false;

import type { APIRoute } from 'astro';
import { prisma } from '@/lib/db/prisma';
import { getNumericLimit, withErrorHandling } from '@/lib/utils/handlers';
import { jsonResponse } from '@/lib/utils/http';
import { requireAdmin, requireUser } from '@/server/permissions/authz';

export const GET: APIRoute = (context) =>
  withErrorHandling(async () => {
    const user = await requireUser(context);
    requireAdmin(user);

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        honourScore: true,
        skillRating: true,
        suspensionNote: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: getNumericLimit(context, 50, 200),
    });

    return jsonResponse(200, { users });
  });
