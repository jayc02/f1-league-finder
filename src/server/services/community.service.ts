import { prisma } from '@/lib/db/prisma';
import { getPublicUpcomingRaceSlotWhere } from '@/server/services/race-slot.service';
export { getPublicUpcomingRaceSlotWhere } from '@/server/services/race-slot.service';

export const getCommunityMemberCountDisplay = (community: {
  displayedMemberCount: number;
  memberCountSource: string | null;
  _count?: { members?: number };
}) => {
  const source = (community.memberCountSource ?? 'manual').toLowerCase();
  const cachedExternalCount = community.displayedMemberCount;
  const raceHubMembers = community._count?.members ?? 0;

  if ((source === 'discord' || source === 'reddit') && cachedExternalCount > 0) {
    return { count: cachedExternalCount, source };
  }

  if (raceHubMembers > 0) {
    return { count: raceHubMembers, source: 'racehub' };
  }

  if (cachedExternalCount > 0) {
    return { count: cachedExternalCount, source: source || 'manual' };
  }

  return { count: 0, source: 'racehub' };
};

export interface PublicCommunityDiscoveryOptions {
  limit?: number;
  q?: string | null;
  region?: string | null;
  platform?: string | null;
  tag?: string | null;
  sort?: string | null;
  featuredOnly?: boolean;
  verifiedOnly?: boolean;
}

export const getPublicCommunitySummaries = async (optionsOrLimit: PublicCommunityDiscoveryOptions | number = 30) => {
  const options = typeof optionsOrLimit === 'number' ? { limit: optionsOrLimit } : optionsOrLimit;
  const q = options.q?.trim();
  const publicUpcomingRaceSlotWhere = getPublicUpcomingRaceSlotWhere();

  const communities = await prisma.organiserProfile.findMany({
    where: {
      isPublic: true,
      ...(options.region ? { region: options.region as never } : {}),
      ...(options.platform ? { platformFocus: options.platform as never } : {}),
      ...(options.tag ? { tags: { has: options.tag } } : {}),
      ...(options.featuredOnly ? { featured: true } : {}),
      ...(options.verifiedOnly ? { verified: true } : {}),
      ...(q
        ? {
            OR: [
              { displayName: { contains: q, mode: 'insensitive' } },
              { shortDescription: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
              { tags: { hasSome: q.split(' ').filter(Boolean) } },
            ],
          }
        : {}),
    },
    orderBy: [{ featured: 'desc' }, { verified: 'desc' }, { updatedAt: 'desc' }],
    take: options.limit ?? 30,
    select: {
      id: true,
      userId: true,
      slug: true,
      displayName: true,
      shortDescription: true,
      description: true,
      brandingColor: true,
      logoUrl: true,
      bannerUrl: true,
      websiteUrl: true,
      discordUrl: true,
      redditUrl: true,
      socials: true,
      gameFocus: true,
      platformFocus: true,
      region: true,
      tags: true,
      isPublic: true,
      featured: true,
      verified: true,
      displayedMemberCount: true,
      memberCountSource: true,
      memberCountLastSyncedAt: true,
      credibilityNotes: true,
      createdAt: true,
      updatedAt: true,
      raceSlots: {
        where: publicUpcomingRaceSlotWhere,
        take: 3,
        orderBy: { scheduledAt: 'asc' },
        select: {
          id: true,
          title: true,
          scheduledAt: true,
          maxPlayers: true,
          _count: {
            select: {
              registrations: true,
            },
          },
        },
      },
      communityDriverRatings: {
        orderBy: [{ skillRating: 'desc' }, { honourScore: 'desc' }],
        take: 8,
        select: {
          skillRating: true,
          honourScore: true,
          cleanRaces: true,
          starts: true,
          user: { select: { username: true, avatarUrl: true } },
        },
      },
      _count: {
        select: {
          members: { where: { status: 'ACTIVE' } },
          raceSlots: {
            where: publicUpcomingRaceSlotWhere,
          },
        },
      },
    },
  });

  const mapped = communities.map((community) => {
    const memberDisplay = getCommunityMemberCountDisplay(community);
    const topDriver = community.communityDriverRatings[0] ?? null;
    const ratingSample = community.communityDriverRatings;
    const averageHonourScore = ratingSample.length ? Math.round(ratingSample.reduce((sum, row) => sum + row.honourScore, 0) / ratingSample.length) : null;

    return {
      ...community,
      topDriver,
      averageHonourScore,
      rankedDriverCount: ratingSample.length,
      reputationScore: topDriver?.skillRating ?? null,
      raceHubMemberCount: community._count.members,
      externalMemberCount:
        ['discord', 'reddit'].includes(community.memberCountSource.toLowerCase()) && community.displayedMemberCount > 0
          ? community.displayedMemberCount
          : null,
      externalMemberSource: ['discord', 'reddit'].includes(community.memberCountSource.toLowerCase()) ? community.memberCountSource.toLowerCase() : null,
      displayedMemberCount: memberDisplay.count,
      memberCountSource: memberDisplay.source,
    };
  });

  const sort = options.sort ?? 'featured';
  if (sort === 'az') mapped.sort((a, b) => a.displayName.localeCompare(b.displayName));
  if (sort === 'events') mapped.sort((a, b) => b._count.raceSlots - a._count.raceSlots || a.displayName.localeCompare(b.displayName));
  if (sort === 'members') mapped.sort((a, b) => b.displayedMemberCount - a.displayedMemberCount || a.displayName.localeCompare(b.displayName));
  if (sort === 'sr') mapped.sort((a, b) => (b.reputationScore ?? 0) - (a.reputationScore ?? 0) || a.displayName.localeCompare(b.displayName));
  if (sort === 'verified') mapped.sort((a, b) => Number(b.verified) - Number(a.verified) || b._count.raceSlots - a._count.raceSlots);
  if (sort === 'featured') mapped.sort((a, b) => Number(b.featured) - Number(a.featured) || Number(b.verified) - Number(a.verified) || b._count.raceSlots - a._count.raceSlots);

  return mapped;
};

export type PublicCommunitySummary = Awaited<ReturnType<typeof getPublicCommunitySummaries>>[number];
