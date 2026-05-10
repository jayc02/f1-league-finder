import { prisma } from '@/lib/db/prisma';

export const parseDiscordInviteCode = (discordUrl?: string | null) => {
  if (!discordUrl) return null;
  try {
    const url = new URL(discordUrl);
    const host = url.hostname.replace(/^www\./, '');
    if (!['discord.gg', 'discord.com', 'discordapp.com'].includes(host)) return null;
    const parts = url.pathname.split('/').filter(Boolean);
    return host === 'discord.gg' ? parts[0] ?? null : parts[0] === 'invite' ? parts[1] ?? null : null;
  } catch {
    return null;
  }
};

export const parseSubredditName = (redditUrl?: string | null) => {
  if (!redditUrl) return null;
  try {
    const url = new URL(redditUrl);
    const host = url.hostname.replace(/^www\./, '');
    if (!['reddit.com', 'old.reddit.com', 'new.reddit.com'].includes(host)) return null;
    const [kind, name] = url.pathname.split('/').filter(Boolean);
    return kind?.toLowerCase() === 'r' && name ? name : null;
  } catch {
    const match = redditUrl.match(/(?:^|\/)r\/([A-Za-z0-9_]+)/i);
    return match?.[1] ?? null;
  }
};

export const syncCommunityMemberCounts = async (organiserProfileId: string) => {
  const community = await prisma.organiserProfile.findUnique({
    where: { id: organiserProfileId },
    select: { id: true, discordUrl: true, redditUrl: true },
  });
  if (!community) return { ok: false, source: 'missing' as const };

  const now = new Date();
  const discordCode = parseDiscordInviteCode(community.discordUrl);
  if (discordCode) {
    try {
      const response = await fetch(`https://discord.com/api/v10/invites/${encodeURIComponent(discordCode)}?with_counts=true`, {
        headers: { accept: 'application/json' },
      });
      if (response.ok) {
        const payload = (await response.json()) as { approximate_member_count?: number; approximate_presence_count?: number };
        if (typeof payload.approximate_member_count === 'number') {
          await prisma.organiserProfile.update({
            where: { id: community.id },
            data: {
              displayedMemberCount: payload.approximate_member_count,
              memberCountSource: 'discord-sync',
              memberCountLastSyncedAt: now,
            },
          });
          return { ok: true, source: 'discord-sync' as const, count: payload.approximate_member_count, presence: payload.approximate_presence_count };
        }
      }
    } catch (error) {
      console.warn('[community-count-sync] Discord count sync failed', error);
    }
  }

  const subreddit = parseSubredditName(community.redditUrl);
  if (subreddit) {
    try {
      const response = await fetch(`https://www.reddit.com/r/${encodeURIComponent(subreddit)}/about.json`, {
        headers: { accept: 'application/json', 'user-agent': 'RaceHub/1.0 community count sync' },
      });
      if (response.ok) {
        const payload = (await response.json()) as { data?: { subscribers?: number } };
        if (typeof payload.data?.subscribers === 'number') {
          await prisma.organiserProfile.update({
            where: { id: community.id },
            data: {
              displayedMemberCount: payload.data.subscribers,
              memberCountSource: 'reddit-sync',
              memberCountLastSyncedAt: now,
            },
          });
          return { ok: true, source: 'reddit-sync' as const, count: payload.data.subscribers };
        }
      }
    } catch (error) {
      console.warn('[community-count-sync] Reddit count sync failed', error);
    }
  }

  const raceHubMembers = await prisma.organiserProfileMember.count({ where: { organiserProfileId: community.id, status: 'ACTIVE' } });
  await prisma.organiserProfile.update({
    where: { id: community.id },
    data: {
      displayedMemberCount: raceHubMembers,
      memberCountSource: 'racehub',
      memberCountLastSyncedAt: now,
    },
  });
  return { ok: true, source: 'racehub' as const, count: raceHubMembers };
};
