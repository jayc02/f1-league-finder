export const prerender = false;

import type { APIRoute } from 'astro';
import { assertAllowedOrigin } from '@/lib/server/origin-guard';
import { prisma } from '@/lib/db/prisma';
import { updateCommunitySchema } from '@/lib/validation/community';
import { parseBody, withErrorHandling } from '@/lib/utils/handlers';
import { HttpError, jsonResponse } from '@/lib/utils/http';
import { privateApiNoStore } from '@/lib/server/cache-control';
import { removeManagedUploadIfPresent, saveUploadedImage } from '@/lib/server/upload-storage';
import { requireUser } from '@/server/permissions/authz';
import { canManageCommunityProfile, OrganiserProfileMemberRole, OrganiserProfileMemberStatus } from '@/lib/server/community-permissions';

const normalizeSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);

const buildCommunityResponse = (community: { id: string; slug: string; displayName: string; isPublic?: boolean | null }) => ({
  community: {
    id: community.id,
    slug: community.slug,
    displayName: community.displayName,
    ...(community.isPublic ? { publicUrl: `/communities/${community.slug}` } : {}),
    manageUrl: '/dashboard/community',
  },
});

const ensureCreateSlug = async (requestedSlug: string, displayName: string) => {
  const base = normalizeSlug(requestedSlug || displayName) || 'community';
  let candidate = base;
  let suffix = 2;

  while (await prisma.organiserProfile.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    const suffixText = `-${suffix}`;
    candidate = `${base.slice(0, 80 - suffixText.length)}${suffixText}`;
    suffix += 1;
  }

  return candidate;
};

export const GET: APIRoute = (context) =>
  withErrorHandling(async () => {
    const user = await requireUser(context);

    const profile = await prisma.organiserProfile.findUnique({ where: { userId: user.id } });
    const response = jsonResponse(200, { community: profile });
    response.headers.set('Cache-Control', privateApiNoStore);
    return response;
  });

export const PATCH: APIRoute = (context) =>
  withErrorHandling(async () => {
    assertAllowedOrigin(context.request);
    const user = await requireUser(context);

    const existingProfile = await prisma.organiserProfile.findUnique({
      where: { userId: user.id },
      select: { id: true, userId: true, logoUrl: true, bannerUrl: true },
    });
    if (existingProfile && !(await canManageCommunityProfile(user, existingProfile))) {
      throw new HttpError(403, 'Insufficient community permissions.');
    }

    const contentType = context.request.headers.get('content-type') ?? '';
    let body: ReturnType<typeof updateCommunitySchema.parse>;

    if (contentType.includes('multipart/form-data')) {
      const formData = await context.request.formData();
      const logoFile = formData.get('logo');
      const bannerFile = formData.get('banner');

      let logoUrl = typeof formData.get('logoUrl') === 'string' && String(formData.get('logoUrl')).trim() ? String(formData.get('logoUrl')).trim() : undefined;
      let bannerUrl = typeof formData.get('bannerUrl') === 'string' && String(formData.get('bannerUrl')).trim() ? String(formData.get('bannerUrl')).trim() : undefined;

      if (logoFile instanceof File && (logoFile.size > 0 || logoFile.name)) {
        logoUrl = await saveUploadedImage(logoFile, {
          folder: 'community-logos',
          maxBytes: 2 * 1024 * 1024,
          label: 'community logo',
        });
      }

      if (bannerFile instanceof File && (bannerFile.size > 0 || bannerFile.name)) {
        bannerUrl = await saveUploadedImage(bannerFile, {
          folder: 'community-banners',
          maxBytes: 5 * 1024 * 1024,
          label: 'community banner',
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
        featured: formData.has('featured') ? String(formData.get('featured')) === 'true' : undefined,
        verified: formData.has('verified') ? String(formData.get('verified')) === 'true' : undefined,
        credibilityNotes: typeof formData.get('credibilityNotes') === 'string' ? String(formData.get('credibilityNotes')) || null : null,
      });
    } else {
      body = await parseBody(context.request, updateCommunitySchema);
    }

    const platformBadgePatch = user.role === 'ADMIN'
      ? {
          ...(typeof body.featured === 'boolean' ? { featured: body.featured } : {}),
          ...(typeof body.verified === 'boolean' ? { verified: body.verified } : {}),
        }
      : {};
    const { featured: _featured, verified: _verified, ...communityBody } = body;

    const normalizedSlug = normalizeSlug(communityBody.slug || communityBody.displayName);
    if (!normalizedSlug) throw new HttpError(400, 'A valid community slug is required.');

    const existingBySlug = await prisma.organiserProfile.findUnique({ where: { slug: normalizedSlug }, select: { userId: true } });
    if (existingProfile && existingBySlug && existingBySlug.userId !== user.id) {
      throw new HttpError(409, 'That community slug is already in use.');
    }

    const createSlug = existingProfile ? normalizedSlug : await ensureCreateSlug(normalizedSlug, communityBody.displayName);

    const community = await prisma.$transaction(async (tx) => {
      const saved = await tx.organiserProfile.upsert({
        where: { userId: user.id },
        update: { ...communityBody, ...platformBadgePatch, slug: normalizedSlug },
        create: {
          userId: user.id,
          displayName: communityBody.displayName,
          slug: createSlug,
          shortDescription: communityBody.shortDescription,
          description: communityBody.description,
          brandingColor: communityBody.brandingColor,
          logoUrl: communityBody.logoUrl,
          bannerUrl: communityBody.bannerUrl,
          websiteUrl: communityBody.websiteUrl,
          discordUrl: communityBody.discordUrl,
          redditUrl: communityBody.redditUrl,
          socials: communityBody.socials,
          gameFocus: communityBody.gameFocus,
          platformFocus: communityBody.platformFocus,
          region: communityBody.region ?? user.region,
          tags: communityBody.tags ?? [],
          isPublic: communityBody.isPublic ?? true,
          displayedMemberCount: communityBody.displayedMemberCount ?? 0,
          memberCountSource: communityBody.memberCountSource ?? 'manual',
          credibilityNotes: communityBody.credibilityNotes,
          ...platformBadgePatch,
        },
      });

      if (user.role === 'PLAYER') {
        await tx.user.update({ where: { id: user.id }, data: { role: 'ORGANISER' } });
      }

      await tx.organiserProfileMember.upsert({
        where: { organiserProfileId_userId: { organiserProfileId: saved.id, userId: user.id } },
        update: { role: OrganiserProfileMemberRole.OWNER, status: OrganiserProfileMemberStatus.ACTIVE },
        create: { organiserProfileId: saved.id, userId: user.id, role: OrganiserProfileMemberRole.OWNER, status: OrganiserProfileMemberStatus.ACTIVE },
      });

      const leagueCount = await tx.league.count({ where: { organiserProfileId: saved.id } });
      if (leagueCount === 0) {
        await tx.league.create({
          data: {
            name: `${saved.displayName} Community Events`,
            slug: `${saved.slug}-community-events`,
            description: `Default RaceHub event calendar for ${saved.displayName}.`,
            ownerId: user.id,
            organiserProfileId: saved.id,
            region: saved.region,
          },
        });
      }

      return saved;
    });

    if (communityBody.logoUrl && communityBody.logoUrl !== existingProfile?.logoUrl) {
      await removeManagedUploadIfPresent(existingProfile?.logoUrl);
    }

    if (communityBody.bannerUrl && communityBody.bannerUrl !== existingProfile?.bannerUrl) {
      await removeManagedUploadIfPresent(existingProfile?.bannerUrl);
    }

    const response = jsonResponse(200, buildCommunityResponse(community));
    response.headers.set('Cache-Control', privateApiNoStore);
    return response;
  });
