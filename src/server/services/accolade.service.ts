import type { LeaderboardEntry } from '@/server/services/leaderboard.service';

export type AccoladeCategory = 'rank' | 'performance' | 'clean' | 'activity' | 'status';

export interface PlayerAccolade {
  id: string;
  title: string;
  description: string;
  category: AccoladeCategory;
  tier: 'legend' | 'elite' | 'pro' | 'core';
}

interface AccoladeInput {
  profile: {
    role: 'PLAYER' | 'ORGANISER' | 'ADMIN';
    createdAt: Date;
    honourScore: number;
    region: string;
  };
  stats: {
    starts: number;
    wins: number;
    podiums: number;
    cleanFinishes: number;
    bestFinish: number | null;
    weeklyStarts: number;
    weeklyPoints: number;
  };
  ranks: {
    global: number | null;
    regional: number | null;
    region: string;
  };
}

const create = (id: string, title: string, description: string, category: AccoladeCategory, tier: PlayerAccolade['tier']): PlayerAccolade => ({ id, title, description, category, tier });

export const buildAccolades = (input: AccoladeInput): PlayerAccolade[] => {
  const accolades: PlayerAccolade[] = [];
  const { stats, ranks, profile } = input;

  if (ranks.global === 1) accolades.push(create('world-1', 'World #1', 'Current global leader in GRID//ONE standings.', 'rank', 'legend'));
  if (ranks.global && ranks.global <= 10) accolades.push(create('top-10', 'Top 10 F1', 'Sits inside the global top ten.', 'rank', 'legend'));
  if (ranks.global && ranks.global <= 50) accolades.push(create('top-50', 'Top 50 F1', 'Global top fifty contender.', 'rank', 'elite'));
  if (ranks.global && ranks.global <= 100) accolades.push(create('top-100', 'Top 100 F1', 'Part of the global top hundred.', 'rank', 'elite'));
  if (ranks.global && ranks.global <= 250) accolades.push(create('top-250', 'Top 250 F1', 'Competitive presence in the top 250.', 'rank', 'pro'));
  if (ranks.global && ranks.global <= 500) accolades.push(create('top-500', 'Top 500 F1', 'Recognized in the top 500 rankings.', 'rank', 'core'));
  if (ranks.regional && ranks.regional <= 10) accolades.push(create('regional-top-10', 'Regional Top 10', `${ranks.region} elite ranking.`, 'rank', 'elite'));
  if (ranks.regional && ranks.regional <= 50) accolades.push(create('regional-top-50', 'Regional Top 50', `${ranks.region} front-running status.`, 'rank', 'pro'));

  if (stats.wins >= 100) accolades.push(create('wins-100', 'Century Winner', '100+ race wins recorded.', 'performance', 'legend'));
  if (stats.wins >= 50) accolades.push(create('wins-50', '50 Race Wins', 'Reached 50 race victories.', 'performance', 'elite'));
  if (stats.wins >= 25) accolades.push(create('wins-25', '25 Race Wins', 'Quarter-century wins benchmark.', 'performance', 'pro'));
  if (stats.wins >= 10) accolades.push(create('wins-10', '10 Race Wins', 'Double-digit race winner.', 'performance', 'core'));
  if (stats.podiums >= 25) accolades.push(create('podium-regular', 'Podium Regular', '25+ podium finishes.', 'performance', 'pro'));
  if (stats.bestFinish === 1 && stats.wins >= 2) accolades.push(create('event-winner', 'Event Winner', 'Multiple event victories secured.', 'performance', 'core'));
  if (stats.wins >= 5) accolades.push(create('multi-event', 'Multi-Event Winner', 'Consistent winner across events.', 'performance', 'elite'));
  if (stats.bestFinish === 1 && stats.weeklyPoints >= 30) accolades.push(create('driver-week', 'Driver of the Week', 'Strong current form with race-winning pace.', 'status', 'elite'));

  if (profile.honourScore >= 140) accolades.push(create('honour-elite', 'Honour Elite', 'Outstanding clean-racing reputation.', 'clean', 'legend'));
  if (profile.honourScore >= 120) accolades.push(create('steward-trust', 'Steward’s Trust', 'Trusted by stewards and organisers.', 'clean', 'elite'));
  if (stats.starts >= 12 && stats.cleanFinishes / Math.max(stats.starts, 1) >= 0.75) accolades.push(create('clean-driver', 'Clean Driver', 'High clean-race completion ratio.', 'clean', 'pro'));
  if (stats.starts >= 8 && stats.cleanFinishes >= stats.starts - 1) accolades.push(create('incident-free', 'Incident-Free Streak', 'Near-perfect clean run through recent starts.', 'clean', 'elite'));
  if (stats.cleanFinishes >= 20) accolades.push(create('respect-earned', 'Respect Earned', '20+ clean finishes.', 'clean', 'core'));

  if (stats.starts >= 100) accolades.push(create('starts-100', '100 Starts', 'Century mark for competitive starts.', 'activity', 'legend'));
  if (stats.starts >= 50) accolades.push(create('starts-50', '50 Starts', 'Fifty confirmed race starts.', 'activity', 'elite'));
  if (stats.starts >= 10) accolades.push(create('starts-10', 'First 10 Starts', 'First major participation milestone.', 'activity', 'core'));
  if (stats.starts >= 80) accolades.push(create('grid-veteran', 'Grid Veteran', 'Long-term grid presence.', 'activity', 'elite'));
  if (stats.weeklyStarts >= 2) accolades.push(create('weekly-competitor', 'Weekly Competitor', 'Actively racing week-to-week.', 'activity', 'pro'));

  const daysSinceJoined = Math.floor((Date.now() - profile.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  if (daysSinceJoined <= 60) accolades.push(create('early-adopter', 'Early Adopter', 'Joined in the platform’s early competitive era.', 'status', 'core'));
  if (profile.role === 'ORGANISER' || profile.role === 'ADMIN') accolades.push(create('verified-organiser-driver', 'Verified Organiser Driver', 'Competes while running organised events.', 'status', 'pro'));
  if (stats.weeklyPoints >= 45) accolades.push(create('breakthrough', 'Breakthrough Driver', 'Major points surge this week.', 'status', 'elite'));

  return accolades;
};

export const pickFeaturedAccolade = (accolades: PlayerAccolade[]): PlayerAccolade | null => {
  if (!accolades.length) return null;
  const tierScore: Record<PlayerAccolade['tier'], number> = { legend: 4, elite: 3, pro: 2, core: 1 };
  return [...accolades].sort((a, b) => tierScore[b.tier] - tierScore[a.tier])[0];
};

export const groupAccolades = (accolades: PlayerAccolade[]) => {
  return accolades.reduce<Record<AccoladeCategory, PlayerAccolade[]>>(
    (acc, accolade) => {
      acc[accolade.category].push(accolade);
      return acc;
    },
    { rank: [], performance: [], clean: [], activity: [], status: [] },
  );
};

export const buildProfileStatus = (entry: LeaderboardEntry | null) => {
  if (!entry) return null;
  const winRate = entry.starts ? entry.wins / entry.starts : 0;
  const podiumRate = entry.starts ? entry.podiums / entry.starts : 0;

  return {
    winRate,
    podiumRate,
    cleanRaceRatio: entry.cleanRaceRatio,
    activeStreak: Math.max(0, Math.min(8, Math.round(entry.weeklyPoints / 8))),
    movement: entry.trend,
    bestFinish: entry.bestFinish,
  };
};
