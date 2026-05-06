export const prerender = false;
import type { APIRoute } from 'astro';
import { publicApiShort } from '@/lib/server/cache-control';
import { prisma } from '@/lib/db/prisma';
import { createLeagueSchema } from '@/lib/validation/league';
import { parseBody, withErrorHandling } from '@/lib/utils/handlers';
import { HttpError, jsonResponse } from '@/lib/utils/http';
import { requireOrganiserOrAdmin, requireUser } from '@/server/permissions/authz';

export const GET: APIRoute = () =>
  withErrorHandling(async () => {
    const leagues = await prisma.league.findMany({
      include: {
        owner: { select: { id: true, username: true } },
        _count: { select: { raceSlots: true } },
      },
      orderBy: [{ active: 'desc' }, { createdAt: 'desc' }],
    });

    const response = jsonResponse(200, { leagues });
    response.headers.set('Cache-Control', publicApiShort);
    return response;
  });

export const POST: APIRoute = (context) =>
  withErrorHandling(async () => {
    const user = await requireUser(context);
    requireOrganiserOrAdmin(user);

    const body = await parseBody(context.request, createLeagueSchema);

    const duplicate = await prisma.league.findUnique({ where: { slug: body.slug } });
    if (duplicate) throw new HttpError(409, 'League slug already exists.');

    const organiserProfile =
      user.role === 'ORGANISER'
        ? await prisma.organiserProfile.upsert({
            where: { userId: user.id },
            update: {
              displayName: body.organiserDisplayName ?? user.username,
              description: body.organiserDescription,
            },
            create: {
              userId: user.id,
              displayName: body.organiserDisplayName ?? user.username,
              description: body.organiserDescription,
            },
          })
        : null;

    const league = await prisma.league.create({
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description,
        region: body.region,
        brandingPrimary: body.brandingPrimary,
        brandingSecondary: body.brandingSecondary,
        ownerId: user.id,
        organiserProfileId: organiserProfile?.id,
      },
    });

    return jsonResponse(201, { league });
  });
