export type Platform = "youtube";

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
  viewerCount: number; // 실시간 시청자 수
  diffFromYesterday: number; // 어제 대비 순위 변동
  donationRevenue?: number; // 도네이션 수익 (원)
  superchatRevenue?: number; // 슈퍼챗 수익 (원)
  totalRevenue?: number; // 총 수익 (원)
}

export interface LiveEntry {
  bj: BJ;
  title: string;
  viewerCount?: number;
  startedAt?: string;
  /** Detected categories for this stream (multiple categories possible) */
  detectedCategories?: Array<{
    categoryId: string;
    score: number;
  }>;
  /** Primary category ID (highest confidence) */
  primaryCategoryId?: string;
}

