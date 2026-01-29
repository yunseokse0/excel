"use server";

import { getSupabaseServerClient } from "../supabase-server";
import type { AdStats, AdStatsByDate } from "../../types/ad";

/**
 * 광고 노출 수를 증가시킵니다.
 */
export async function incrementAdImpression(
  adId: string,
  pagePath?: string,
  sessionId?: string,
  userGroup?: string
) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return; // Frontend 기반 모드에서는 건너뛰기

  try {
    // 노출 수 증가
    await supabase.rpc("increment_ad_impression", {
      p_ad_id: adId,
    });

    // 상세 로그 기록
    await supabase.from("ad_stats_logs").insert({
      ad_id: adId,
      event_type: "impression",
      page_path: pagePath || null,
      session_id: sessionId || null,
      user_group: userGroup || null,
    });
  } catch (error) {
    // Supabase 에러는 무시
    console.warn("Failed to increment ad impression:", error);
  }
}

/**
 * 광고 클릭 수를 증가시킵니다.
 */
export async function incrementAdClick(
  adId: string,
  pagePath?: string,
  sessionId?: string,
  userGroup?: string
) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return; // Frontend 기반 모드에서는 건너뛰기

  try {
    // 클릭 수 증가
    await supabase.rpc("increment_ad_click", {
      p_ad_id: adId,
    });

    // 상세 로그 기록
    await supabase.from("ad_stats_logs").insert({
      ad_id: adId,
      event_type: "click",
      page_path: pagePath || null,
      session_id: sessionId || null,
      user_group: userGroup || null,
    });
  } catch (error) {
    // Supabase 에러는 무시
    console.warn("Failed to increment ad click:", error);
  }
}

/**
 * 특정 광고의 통계를 가져옵니다.
 */
export async function getAdStats(adId: string): Promise<AdStats | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null; // Frontend 기반 모드

  try {
    const { data: ad, error } = await supabase
      .from("ads")
      .select("id, click_count, impression_count")
      .eq("id", adId)
      .single();

    if (error || !ad) {
      return null;
    }

    const impressions = ad.impression_count || 0;
    const clicks = ad.click_count || 0;
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

    return {
      adId: ad.id,
      impressions,
      clicks,
      ctr: Math.round(ctr * 100) / 100, // 소수점 2자리
      views: impressions,
    };
  } catch (error) {
    console.warn("Failed to get ad stats:", error);
    return null;
  }
}

/**
 * 모든 광고의 통계를 가져옵니다.
 */
export async function getAllAdsStats(): Promise<AdStats[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return []; // Frontend 기반 모드

  try {
    const { data: ads, error } = await supabase
      .from("ads")
      .select("id, click_count, impression_count")
      .order("impression_count", { ascending: false });

    if (error || !ads) {
      return [];
    }

    return ads.map((ad) => {
      const impressions = ad.impression_count || 0;
      const clicks = ad.click_count || 0;
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

      return {
        adId: ad.id,
        impressions,
        clicks,
        ctr: Math.round(ctr * 100) / 100,
        views: impressions,
      };
    });
  } catch (error) {
    console.warn("Failed to get all ads stats:", error);
    return [];
  }
}

/**
 * 특정 기간의 광고 통계를 날짜별로 가져옵니다.
 */
export async function getAdStatsByDate(
  adId: string,
  startDate: string,
  endDate: string
): Promise<AdStatsByDate[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return []; // Frontend 기반 모드

  try {
    const { data: logs, error } = await supabase
      .from("ad_stats_logs")
      .select("event_type, created_at")
      .eq("ad_id", adId)
      .gte("created_at", startDate)
      .lte("created_at", endDate)
      .order("created_at", { ascending: true });

    if (error || !logs) {
      return [];
    }
  } catch (error) {
    console.warn("Failed to get ad stats by date:", error);
    return [];
  }

  // 날짜별로 그룹화
  const statsByDate: Record<string, { impressions: number; clicks: number }> =
    {};

  logs.forEach((log) => {
    const date = new Date(log.created_at).toISOString().split("T")[0];
    if (!statsByDate[date]) {
      statsByDate[date] = { impressions: 0, clicks: 0 };
    }
    if (log.event_type === "impression") {
      statsByDate[date].impressions++;
    } else if (log.event_type === "click") {
      statsByDate[date].clicks++;
    }
  });

  return Object.entries(statsByDate).map(([date, stats]) => {
    const ctr = stats.impressions > 0 ? (stats.clicks / stats.impressions) * 100 : 0;
    return {
      date,
      impressions: stats.impressions,
      clicks: stats.clicks,
      ctr: Math.round(ctr * 100) / 100,
    };
  });
}
