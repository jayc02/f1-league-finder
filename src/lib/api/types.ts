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

export interface RaceSlotSummary {
  id: string;
  title: string;
  scheduledAt: string;
  status: string;
  maxPlayers: number;
  crossplay: boolean;
  platform: string | null;
  formatDetails: string;
  registrationCutoffAt: string;
  region: string;
  rulesSummary: string;
  stakeTierMetadata?: string | null;
  league: LeagueSummary;
  organiser: { id: string; username: string };
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
