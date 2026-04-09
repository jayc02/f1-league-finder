export interface PublicUser {
  id: string;
  username: string;
  avatarUrl: string | null;
  region: string;
  honourScore: number;
  skillRating: number;
}

export interface LeaderboardResponse {
  leaderboard: PublicUser[];
}

export interface RaceSlotListResponse {
  raceSlots: Array<{
    id: string;
    title: string;
    scheduledAt: string;
    status: string;
    maxPlayers: number;
  }>;
}
