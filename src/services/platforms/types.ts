export type PlatformId = "codeforces" | "atcoder" | "leetcode";

export interface PlatformHandle {
  platform: PlatformId;
  handle: string;
}

export interface PlatformActivity {
  date: string;
  count: number;
  difficulty?: number;
}

export interface RecentSolve {
  id: string;
  name: string;
  platform: PlatformId;
  tags: string[];
  difficulty?: string;
  sourceUrl: string;
  solvedAt: string;
}

export interface PlatformProfile {
  platform: PlatformId;
  handle: string;
  profileUrl: string;
  rating?: string;
  rank?: string;
  solved?: string;
  extra?: string;
  activity?: PlatformActivity[];
  recentSolves?: RecentSolve[];
}

export interface PlatformProfileRefreshResult {
  profiles: PlatformProfile[];
  errors: Partial<Record<PlatformId, string>>;
}
