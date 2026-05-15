export type UserRole = 'PLAYER' | 'ORGANISER' | 'ADMIN';

export interface SessionUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  honourScore: number;
  skillRating: number;
  region?: string;
  preferredPlatform?: 'PC' | 'PLAYSTATION' | 'XBOX' | null;
  bio?: string | null;
  avatarUrl?: string | null;
}

export interface LeagueSummary {
  id: string;
  name: string;
  slug: string;
}

export interface CommunitySummary {
  id: string;
  slug: string;
  displayName: string;
  shortDescription?: string | null;
  description?: string | null;
  brandingColor?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  region: string;
  platformFocus?: string | null;
  gameFocus?: string | null;
  tags: string[];
  verified: boolean;
  featured: boolean;
  displayedMemberCount: number;
  memberCountSource: string;
  discordUrl?: string | null;
  redditUrl?: string | null;
  websiteUrl?: string | null;
  socials?: Record<string, string> | null;
  _count: { raceSlots: number };
  raceSlots?: Array<{
    id: string;
    title: string;
    scheduledAt: string;
    maxPlayers: number;
    _count: { registrations: number };
  }>;
}

export interface RaceSlotSummary {
  id: string;
  title: string;
  track?: string | null;
  eventNotes?: string | null;
  visibility: 'PUBLIC' | 'COMMUNITY_ONLY' | 'UNLISTED' | 'PRIVATE';
  leagueId: string;
  organiserId: string;
  organiserProfileId?: string | null;
  scheduledAt: string;
  region: string;
  game: string;
  platform: string | null;
  crossplay: boolean;
  formatDetails: string;
  lobbySettings?: Record<string, string | number | boolean> | null;
  maxPlayers: number;
  status: string;
  registrationCutoffAt: string;
  rulesSummary: string;
  stakeTierMetadata?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt: string;
  league: LeagueSummary;
  organiser: { id: string; username: string };
  organiserProfile?: { id: string; slug: string; displayName: string; logoUrl?: string | null } | null;
  _count: { registrations: number };
}

export interface RaceSlotDetail extends RaceSlotSummary {
  lobbySettings?: Record<string, string | number | boolean> | null;
  registrations: Array<{
    id: string;
    user: {
      id: string;
      username: string;
      avatarUrl: string | null;
      skillRating: number;
      honourScore: number;
    };
    createdAt: string;
  }>;
  result: null | {
    id: string;
    notes: string | null;
    evidenceUrl: string | null;
    confirmationState: string;
    entries: Array<{
      id: string;
      finishingPosition: number;
      pointsAwarded: number;
      ratingDelta: number;
      honourDelta: number;
      user: { id: string; username: string };
    }>;
  };
}
