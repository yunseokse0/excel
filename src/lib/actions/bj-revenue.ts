"use server";

import { getSupabaseServerClient } from "../supabase-server";
import { revalidatePath } from "next/cache";

/**
 * BJ의 도네이션 수익을 업데이트합니다.
 */
export async function updateBJDonationRevenue(
  bjId: string,
  revenue: number
) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return { success: false, error: "Supabase가 설정되지 않았습니다." };
  }

  try {
    const { error } = await supabase
      .from("bj_stats")
      .update({
        donation_revenue: revenue,
        updated_at: new Date().toISOString(),
      })
      .eq("bj_id", bjId);

    if (error) {
      console.error("Failed to update BJ donation revenue", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/ranking");
    revalidatePath("/admin/ranking");
    return { success: true };
  } catch (error) {
    console.error("Failed to update BJ donation revenue:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * BJ의 슈퍼챗 수익을 업데이트합니다.
 */
export async function updateBJSuperchatRevenue(
  bjId: string,
  revenue: number
) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return { success: false, error: "Supabase가 설정되지 않았습니다." };
  }

  try {
    const { error } = await supabase
      .from("bj_stats")
      .update({
        superchat_revenue: revenue,
        updated_at: new Date().toISOString(),
      })
      .eq("bj_id", bjId);

    if (error) {
      console.error("Failed to update BJ superchat revenue", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/ranking");
    revalidatePath("/admin/ranking");
    return { success: true };
  } catch (error) {
    console.error("Failed to update BJ superchat revenue:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * BJ의 수익을 일괄 업데이트합니다.
 */
export async function updateBJRevenue(
  bjId: string,
  donationRevenue: number,
  superchatRevenue: number
) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return { success: false, error: "Supabase가 설정되지 않았습니다." };
  }

  try {
    const { error } = await supabase
      .from("bj_stats")
      .update({
        donation_revenue: donationRevenue,
        superchat_revenue: superchatRevenue,
        updated_at: new Date().toISOString(),
      })
      .eq("bj_id", bjId);

    if (error) {
      console.error("Failed to update BJ revenue", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/ranking");
    revalidatePath("/admin/ranking");
    return { success: true };
  } catch (error) {
    console.error("Failed to update BJ revenue:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * 모든 BJ의 수익 통계를 가져옵니다.
 */
export async function getAllBJRevenue() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return { success: false, error: "Supabase가 설정되지 않았습니다.", revenue: [] };
  }

  try {
    const { data, error } = await supabase
      .from("bj_stats")
      .select(`
        bj_id,
        donation_revenue,
        superchat_revenue,
        bjs:bj_id (
          id,
          name,
          platform
        )
      `)
      .order("donation_revenue", { ascending: false, nullsFirst: false });

    if (error) {
      console.error("Failed to get BJ revenue", error);
      return { success: false, error: error.message, revenue: [] };
    }

    const revenue = (data || []).map((item: any) => ({
      bjId: item.bj_id,
      bjName: item.bjs?.name || "Unknown",
      platform: item.bjs?.platform || "unknown",
      donationRevenue: Number(item.donation_revenue || 0),
      superchatRevenue: Number(item.superchat_revenue || 0),
      totalRevenue:
        Number(item.donation_revenue || 0) +
        Number(item.superchat_revenue || 0),
    }));

    return { success: true, revenue };
  } catch (error) {
    console.error("Failed to get BJ revenue:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      revenue: [],
    };
  }
}
