'use server';

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "../supabase-server";

// TODO: 실제 서비스에서는 Supabase Auth 또는 별도의 관리자 인증 로직을 붙여서
// 호출자가 관리자 권한을 가진 사용자인지 검증해야 합니다.
// 여기서는 데모용으로만 사용한다는 가정 하에 최소한의 패턴만 보여줍니다.

export async function updateBJScore(bjId: string, newScore: number) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return { success: false, error: "Supabase가 설정되지 않았습니다." };
  }

  try {
    const { error } = await supabase
      .from("bj_stats")
      .update({
        current_score: newScore,
        updated_at: new Date().toISOString(),
      })
      .eq("bj_id", bjId);

    if (error) {
      console.error("Failed to update BJ score", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/ranking");
    return { success: true };
  } catch (error) {
    console.error("Failed to update BJ score:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function bulkIncrementAllScores(delta: number) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return { success: false, error: "Supabase가 설정되지 않았습니다." };
  }

  try {
    const { error } = await supabase.rpc("bulk_increment_bj_scores", {
      p_delta: delta,
    });

    if (error) {
      console.error("Failed to bulk increment scores", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/ranking");
    return { success: true };
  } catch (error) {
    console.error("Failed to bulk increment scores:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

