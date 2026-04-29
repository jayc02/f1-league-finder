export const prerender = false;

import type { APIRoute } from 'astro';
import { prisma } from '@/lib/db/prisma';
import { updateCommunitySchema } from '@/lib/validation/community';
import { parseBody, withErrorHandling } from '@/lib/utils/handlers';
import { HttpError, jsonResponse } from '@/lib/utils/http';
import { removeManagedUploadIfPresent, saveUploadedImage } from '@/lib/server/uploads';
import { requireUser } from '@/server/permissions/authz';

export const GET: APIRoute = (context) =>
  withErrorHandling(async () => {
    const user = await requireUser(context);

    const profile = await prisma.organiserProfile.findUnique({ where: { userId: user.id } });
    return jsonResponse(200, { community: profile });
  });

export const PATCH: APIRoute = (context) =>
  withErrorHandling(async () => {
    const user = await requireUser(context);

    const existingProfile = await prisma.organiserProfile.findUnique({
      where: { userId: user.id },
      select: { logoUrl: true, bannerUrl: true },
    });

    const contentType = context.request.headers.get('content-type') ?? '';
    let body: ReturnType<typeof updateCommunitySchema.parse>;

    if (contentType.includes('multipart/form-data')) {
      const formData = await context.request.formData();
      const logoFile = formData.get('logo');
      const bannerFile = formData.get('banner');

      let logoUrl = typeof formData.get('logoUrl') === 'string' && String(formData.get('logoUrl')).trim() ? String(formData.get('logoUrl')).trim() : undefined;
      let bannerUrl = typeof formData.get('bannerUrl') === 'string' && String(formData.get('bannerUrl')).trim() ? String(formData.get('bannerUrl')).trim() : undefined;

      if (logoFile instanceof File && logoFile.size > 0) {
        logoUrl = await saveUploadedImage(logoFile, {
          folder: 'community-logos',
          maxBytes: 2 * 1024 * 1024,
          label: 'Community logo',
        });
      }

      if (bannerFile instanceof File && bannerFile.size > 0) {
        bannerUrl = await saveUploadedImage(bannerFile, {
          folder: 'community-banners',
          maxBytes: 5 * 1024 * 1024,
          label: 'Community banner',
        });
      }

      const tagsValue = typeof formData.get('tags') === 'string' ? String(formData.get('tags')) : '';
      let tags: string[] = [];
      if (tagsValue.trim()) {
        tags = tagsValue
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean);
      }

      body = updateCommunitySchema.parse({
        displayName: typeof formData.get('displayName') === 'string' ? String(formData.get('displayName')) : undefined,
        slug: typeof formData.get('slug') === 'string' ? String(formData.get('slug')) : undefined,
        shortDescription: typeof formData.get('shortDescription') === 'string' ? String(formData.get('shortDescription')) || null : null,
        description: typeof formData.get('description') === 'string' ? String(formData.get('description')) || null : null,
        brandingColor: typeof formData.get('brandingColor') === 'string' ? String(formData.get('brandingColor')) || null : null,
        logoUrl: logoUrl ?? null,
        bannerUrl: bannerUrl ?? null,
        websiteUrl: typeof formData.get('websiteUrl') === 'string' ? String(formData.get('websiteUrl')) || null : null,
        discordUrl: typeof formData.get('discordUrl') === 'string' ? String(formData.get('discordUrl')) || null : null,
        redditUrl: typeof formData.get('redditUrl') === 'string' ? String(formData.get('redditUrl')) || null : null,
        gameFocus: typeof formData.get('gameFocus') === 'string' ? String(formData.get('gameFocus')) || null : null,
        platformFocus:
          typeof formData.get('platformFocus') === 'string' && String(formData.get('platformFocus')).length
            ? String(formData.get('platformFocus'))
            : null,
        region: typeof formData.get('region') === 'string' ? String(formData.get('region')) : undefined,
        tags,
        displayedMemberCount: Number(formData.get('displayedMemberCount') ?? 0),
        memberCountSource:
          typeof formData.get('memberCountSource') === 'string' && String(formData.get('memberCountSource')).length
            ? String(formData.get('memberCountSource'))
            : 'manual',
        isPublic: String(formData.get('isPublic')) === 'true',
        featured: String(formData.get('featured')) === 'true',
        credibilityNotes: typeof formData.get('credibilityNotes') === 'string' ? String(formData.get('credibilityNotes')) || null : null,
      });
    } else {
      body = await parseBody(context.request, updateCommunitySchema);
    }

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

    if (body.logoUrl && body.logoUrl !== existingProfile?.logoUrl) {
      await removeManagedUploadIfPresent(existingProfile?.logoUrl);
    }

    if (body.bannerUrl && body.bannerUrl !== existingProfile?.bannerUrl) {
      await removeManagedUploadIfPresent(existingProfile?.bannerUrl);
    }

    return jsonResponse(200, { community });
  });
