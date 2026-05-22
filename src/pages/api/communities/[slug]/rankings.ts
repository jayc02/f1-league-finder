import type { APIRoute } from 'astro';
import { prisma } from '@/lib/db/prisma';
import { getCommunityRankings, type CommunityRankingType } from '@/server/services/community-rating.service';

export const GET: APIRoute = async ({ params, url, response }) => {
  const slug = params.slug;
  if (!slug) return new Response(JSON.stringify({ error: 'Missing slug' }), { status: 400 });
  const type = (url.searchParams.get('type') ?? 'sr') as CommunityRankingType;
  const limit = Number(url.searchParams.get('limit') ?? 25);
  const community = await prisma.organiserProfile.findFirst({ where: { slug, isPublic: true }, select: { id: true, slug: true, displayName: true, logoUrl: true } });
  if (!community) return new Response(JSON.stringify({ error: 'Community not found' }), { status: 404 });
  const rankings = await getCommunityRankings({ organiserProfileId: community.id, type, limit });
  response.headers.set('Cache-Control', 'public, max-age=30, s-maxage=120, stale-while-revalidate=300');
  return new Response(JSON.stringify({ community, rankings, type }), { status: 200, headers: { 'content-type': 'application/json' } });
};
