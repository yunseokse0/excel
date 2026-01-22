export type Platform = "youtube" | "soop" | "panda";

export interface BJ {
  id: string;
  name: string;
  platform: Platform;
  isLive: boolean;
  currentScore: number;
  thumbnailUrl: string;
  channelUrl: string;
  streamUrl?: string;
}

export interface RankingEntry {
  rank: number;
  bj: BJ;
  points: number;
  diffFromYesterday: number;
}

export interface LiveEntry {
  bj: BJ;
  title: string;
  viewerCount?: number;
  startedAt?: string;
}

