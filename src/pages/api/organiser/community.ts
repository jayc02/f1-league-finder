export const prerender = false;

import type { APIRoute } from 'astro';
import { prisma } from '@/lib/db/prisma';
import { updateCommunitySchema } from '@/lib/validation/community';
import { parseBody, withErrorHandling } from '@/lib/utils/handlers';
import { HttpError, jsonResponse } from '@/lib/utils/http';
import { requireOrganiserOrAdmin, requireUser } from '@/server/permissions/authz';

export const GET: APIRoute = (context) =>
  withErrorHandling(async () => {
    const user = await requireUser(context);
    requireOrganiserOrAdmin(user);

    const profile = await prisma.organiserProfile.findUnique({ where: { userId: user.id } });
    return jsonResponse(200, { community: profile });
  });

export const PATCH: APIRoute = (context) =>
  withErrorHandling(async () => {
    const user = await requireUser(context);
    requireOrganiserOrAdmin(user);

    const body = await parseBody(context.request, updateCommunitySchema);

    const existingBySlug = await prisma.organiserProfile.findUnique({ where: { slug: body.slug }, select: { userId: true } });
    if (existingBySlug && existingBySlug.userId !== user.id) {
      throw new HttpError(409, 'That community slug is already in use.');
    }

    const community = await prisma.organiserProfile.upsert({
      where: { userId: user.id },
      update: body,
      create: {
        userId: user.id,
        displayName: body.displayName,
        slug: body.slug,
        shortDescription: body.shortDescription,
        description: body.description,
        brandingColor: body.brandingColor,
        logoUrl: body.logoUrl,
        bannerUrl: body.bannerUrl,
        websiteUrl: body.websiteUrl,
        discordUrl: body.discordUrl,
        redditUrl: body.redditUrl,
        socials: body.socials,
        gameFocus: body.gameFocus,
        platformFocus: body.platformFocus,
        region: body.region ?? user.region,
        tags: body.tags ?? [],
        isPublic: body.isPublic ?? true,
        featured: body.featured ?? false,
        displayedMemberCount: body.displayedMemberCount ?? 0,
        memberCountSource: body.memberCountSource ?? 'manual',
        credibilityNotes: body.credibilityNotes,
      },
    });

    return jsonResponse(200, { community });
  });
