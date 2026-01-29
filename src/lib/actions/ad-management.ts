"use server";

import { getSupabaseServerClient } from "../supabase-server";
import type { Ad, AdType } from "../../types/ad";
import { revalidatePath } from "next/cache";

interface CreateAdInput {
  type: AdType;
  title?: string;
  imageUrl: string;
  linkUrl?: string;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
  displayOrder?: number;
  abTestGroup?: string;
  abTestVariant?: "A" | "B";
  abTestWeight?: number;
  targetPages?: string[];
  targetUserGroups?: string[];
  scheduleDays?: number[];
  scheduleStartTime?: string;
  scheduleEndTime?: string;
  timezone?: string;
}

/**
 * 광고를 생성합니다.
 */
export async function createAd(input: CreateAdInput) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return { success: false, error: "Supabase not configured" };
  }

  try {
    const { data, error } = await supabase
      .from("ads")
      .insert({
      type: input.type,
      title: input.title || null,
      image_url: input.imageUrl,
      link_url: input.linkUrl || null,
      is_active: input.isActive ?? true,
      start_date: input.startDate || null,
      end_date: input.endDate || null,
      display_order: input.displayOrder ?? 0,
      ab_test_group: input.abTestGroup || null,
      ab_test_variant: input.abTestVariant || null,
      ab_test_weight: input.abTestWeight ?? 50,
      target_pages: input.targetPages || null,
      target_user_groups: input.targetUserGroups || null,
      schedule_days: input.scheduleDays || null,
      schedule_start_time: input.scheduleStartTime || null,
      schedule_end_time: input.scheduleEndTime || null,
      timezone: input.timezone || "Asia/Seoul",
    })
    .select()
    .single();

    if (error) {
      console.error("Failed to create ad:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/");
    return { success: true, ad: data };
  } catch (error) {
    console.error("Failed to create ad:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * 광고를 업데이트합니다.
 */
export async function updateAd(adId: string, input: Partial<CreateAdInput>) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return { success: false, error: "Supabase not configured" };
  }

  try {
    const updateData: any = {};
  if (input.type !== undefined) updateData.type = input.type;
  if (input.title !== undefined) updateData.title = input.title || null;
  if (input.imageUrl !== undefined) updateData.image_url = input.imageUrl;
  if (input.linkUrl !== undefined) updateData.link_url = input.linkUrl || null;
  if (input.isActive !== undefined) updateData.is_active = input.isActive;
  if (input.startDate !== undefined) updateData.start_date = input.startDate || null;
  if (input.endDate !== undefined) updateData.end_date = input.endDate || null;
  if (input.displayOrder !== undefined) updateData.display_order = input.displayOrder;
  if (input.abTestGroup !== undefined) updateData.ab_test_group = input.abTestGroup || null;
  if (input.abTestVariant !== undefined) updateData.ab_test_variant = input.abTestVariant || null;
  if (input.abTestWeight !== undefined) updateData.ab_test_weight = input.abTestWeight;
  if (input.targetPages !== undefined) updateData.target_pages = input.targetPages || null;
  if (input.targetUserGroups !== undefined) updateData.target_user_groups = input.targetUserGroups || null;
  if (input.scheduleDays !== undefined) updateData.schedule_days = input.scheduleDays || null;
  if (input.scheduleStartTime !== undefined) updateData.schedule_start_time = input.scheduleStartTime || null;
  if (input.scheduleEndTime !== undefined) updateData.schedule_end_time = input.scheduleEndTime || null;
  if (input.timezone !== undefined) updateData.timezone = input.timezone;
  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("ads")
    .update(updateData)
    .eq("id", adId)
    .select()
    .single();

    if (error) {
      console.error("Failed to update ad:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/");
    return { success: true, ad: data };
  } catch (error) {
    console.error("Failed to update ad:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * 광고를 삭제합니다.
 */
export async function deleteAd(adId: string) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return { success: false, error: "Supabase not configured" };
  }

  try {
    const { error } = await supabase.from("ads").delete().eq("id", adId);

    if (error) {
      console.error("Failed to delete ad:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete ad:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * A/B 테스트를 고려하여 광고를 선택합니다.
 * 같은 그룹의 광고들 중에서 가중치에 따라 랜덤 선택합니다.
 */
export async function selectAdForABTest(
  type: AdType,
  pagePath?: string,
  userGroup?: string
): Promise<Ad | null> {
  const supabase = getSupabaseServerClient();

  // 활성화된 광고 조회
  let query = supabase
    .from("ads")
    .select("*")
    .eq("type", type)
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  const { data: ads, error } = await query;

  if (error || !ads || ads.length === 0) {
    return null;
  }

  // 날짜 필터링
  const now = new Date();
  const validAds = ads.filter((ad: any) => {
    if (ad.start_date && new Date(ad.start_date) > now) return false;
    if (ad.end_date && new Date(ad.end_date) < now) return false;
    return true;
  });

  // 타겟팅 필터링
  const targetedAds = validAds.filter((ad: any) => {
    // 페이지 타겟팅
    if (ad.target_pages && ad.target_pages.length > 0) {
      if (!pagePath || !ad.target_pages.includes(pagePath)) {
        return false;
      }
    }

    // 사용자 그룹 타겟팅 (현재는 간단히 구현, 실제로는 사용자 세션 정보 필요)
    if (ad.target_user_groups && ad.target_user_groups.length > 0) {
      if (!userGroup || !ad.target_user_groups.includes(userGroup)) {
        return false;
      }
    }

    return true;
  });

  if (targetedAds.length === 0) {
    return null;
  }

  // A/B 테스트 그룹별로 분류
  const adGroups: Record<string, any[]> = {};
  targetedAds.forEach((ad: any) => {
    const groupKey = ad.ab_test_group || "default";
    if (!adGroups[groupKey]) {
      adGroups[groupKey] = [];
    }
    adGroups[groupKey].push(ad);
  });

  // 각 그룹에서 가중치에 따라 선택
  const selectedAds: any[] = [];
  Object.values(adGroups).forEach((groupAds) => {
    if (groupAds.length === 1) {
      selectedAds.push(groupAds[0]);
    } else {
      // 가중치 기반 랜덤 선택
      const totalWeight = groupAds.reduce(
        (sum, ad) => sum + (ad.ab_test_weight || 50),
        0
      );
      let random = Math.random() * totalWeight;
      for (const ad of groupAds) {
        random -= ad.ab_test_weight || 50;
        if (random <= 0) {
          selectedAds.push(ad);
          break;
        }
      }
    }
  });

  // 최종적으로 display_order가 가장 낮은 광고 선택
  selectedAds.sort((a, b) => a.display_order - b.display_order);
  return selectedAds[0] || null;
}

/**
 * 활성화된 광고 목록을 가져옵니다 (프론트엔드용).
 * 브라우저 클라이언트에서도 사용 가능하도록 브라우저 클라이언트를 사용합니다.
 */
export async function getActiveAds(
  type?: AdType,
  pagePath?: string,
  userGroup?: string
) {
  // 서버 사이드에서는 서버 클라이언트, 클라이언트 사이드에서는 브라우저 클라이언트 사용
  try {
    const { getSupabaseBrowserClient } = await import("../supabase-browser");
    const { isWithinSchedule } = await import("../utils/ad-schedule");
    const supabase = getSupabaseBrowserClient();
    
    // Frontend 기반 모드: Supabase가 없으면 빈 배열 반환
    if (!supabase) {
      return { success: true, ads: [] };
    }

    let query = supabase!
      .from("ads")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (type) {
      query = query.eq("type", type);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch ads:", error);
      return { success: false, error: error.message, ads: [] };
    }

    // 날짜 필터링
    const now = new Date();
    let filteredAds =
      data?.filter((ad: any) => {
        if (ad.start_date && new Date(ad.start_date) > now) return false;
        if (ad.end_date && new Date(ad.end_date) < now) return false;
        return true;
      }) || [];

    // 스케줄링 필터링
    filteredAds = filteredAds.filter((ad: any) => {
      return isWithinSchedule(
        ad.schedule_days,
        ad.schedule_start_time,
        ad.schedule_end_time,
        ad.timezone || "Asia/Seoul"
      );
    });

    // 타겟팅 필터링
    if (pagePath || userGroup) {
      filteredAds = filteredAds.filter((ad: any) => {
        // 페이지 타겟팅
        if (ad.target_pages && ad.target_pages.length > 0) {
          if (!pagePath || !ad.target_pages.includes(pagePath)) {
            return false;
          }
        }

        // 사용자 그룹 타겟팅
        if (ad.target_user_groups && ad.target_user_groups.length > 0) {
          if (!userGroup || !ad.target_user_groups.includes(userGroup)) {
            return false;
          }
        }

        return true;
      });
    }

    // A/B 테스트 그룹별로 하나씩만 선택
    const adGroups: Record<string, any[]> = {};
    filteredAds.forEach((ad: any) => {
      const groupKey = ad.ab_test_group || `single-${ad.id}`;
      if (!adGroups[groupKey]) {
        adGroups[groupKey] = [];
      }
      adGroups[groupKey].push(ad);
    });

    const selectedAds: any[] = [];
    Object.values(adGroups).forEach((groupAds) => {
      if (groupAds.length === 1) {
        selectedAds.push(groupAds[0]);
      } else {
        // 가중치 기반 랜덤 선택
        const totalWeight = groupAds.reduce(
          (sum, ad) => sum + (ad.ab_test_weight || 50),
          0
        );
        let random = Math.random() * totalWeight;
        for (const ad of groupAds) {
          random -= ad.ab_test_weight || 50;
          if (random <= 0) {
            selectedAds.push(ad);
            break;
          }
        }
      }
    });

    return { success: true, ads: selectedAds };
  } catch {
    // Supabase 미설정 시 빈 배열 반환
    return { success: true, ads: [] };
  }
}

/**
 * 모든 광고 목록을 가져옵니다 (관리자용).
 */
export async function getAllAds() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return { success: true, ads: [] }; // Frontend 기반 모드
  }

  try {
    const { data, error } = await supabase
      .from("ads")
      .select("*")
      .order("type", { ascending: true })
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Failed to fetch ads:", error);
      return { success: false, error: error.message, ads: [] };
    }

    return { success: true, ads: data || [] };
  } catch (error) {
    console.warn("Failed to get all ads:", error);
    return { success: true, ads: [] };
  }
}
