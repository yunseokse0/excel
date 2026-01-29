"use server";

import { getSupabaseServerClient } from "../supabase-server";

/**
 * 시청자 수 기반 자동 점수 계산 및 랭킹 업데이트
 * 라이브 방송 시간(분) × 시청자 수 × 가중치 = 점수 증가량
 */
export async function calculateScoresFromViewers() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return { success: false, error: "Supabase가 설정되지 않았습니다." };
  }

  try {
    // Supabase 함수 호출 (스키마에 정의된 함수)
    const { error } = await supabase.rpc("calculate_score_from_viewers");

    if (error) {
      console.error("Failed to calculate scores:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error calculating scores:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
