export type AdType = "top_banner" | "popup" | "bottom_banner";

export interface Ad {
  id: string;
  type: AdType;
  title: string | null;
  imageUrl: string;
  linkUrl: string | null;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  displayOrder: number;
  clickCount: number;
  impressionCount: number;
  abTestGroup?: string | null;
  abTestVariant?: "A" | "B" | null;
  abTestWeight?: number;
  targetPages?: string[] | null;
  targetUserGroups?: string[] | null;
  scheduleDays?: number[] | null;
  scheduleStartTime?: string | null;
  scheduleEndTime?: string | null;
  timezone?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdStats {
  adId: string;
  impressions: number;
  clicks: number;
  ctr: number; // Click-Through Rate (%)
  views: number; // 페이지뷰 (impressions와 동일할 수 있음)
  uniqueViews?: number; // 고유 조회수 (선택사항)
}

export interface AdStatsByDate {
  date: string;
  impressions: number;
  clicks: number;
  ctr: number;
}
