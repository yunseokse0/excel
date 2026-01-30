"use server";

import { getSupabaseServerClient } from "../supabase-server";
import { extractYouTubeChannelId } from "../youtube-api";
import { extractSoopBJId } from "../soop-api";
import type { Platform } from "../../types/bj";
import { revalidatePath } from "next/cache";

interface AddBJInput {
  name: string;
  channelUrl: string;
  platform?: Platform; // 자동 감지되지만 수동 지정도 가능
  thumbnailUrl?: string;
  initialScore?: number; // 초기 점수 (선택사항)
}

/**
 * 채널 URL에서 플랫폼을 자동 감지합니다.
 */
function detectPlatformFromUrl(channelUrl: string): Platform | null {
  try {
    const url = new URL(channelUrl);

    if (url.hostname.includes("youtube.com") || url.hostname.includes("youtu.be")) {
      return "youtube";
    }

    if (url.hostname.includes("afreecatv.com") || url.hostname.includes("soop.com")) {
      return "soop";
    }


    return null;
  } catch {
    return null;
  }
}

/**
 * BJ를 Supabase에 추가합니다.
 * 채널 URL에서 플랫폼과 채널 ID를 자동으로 추출합니다.
 */
export async function addBJ(input: AddBJInput) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return {
      success: false,
      error: "Supabase가 설정되지 않았습니다. BJ 추가는 Supabase가 필요합니다.",
    };
  }

  // 1) 플랫폼 감지
  const platform = input.platform || detectPlatformFromUrl(input.channelUrl);

  if (!platform) {
    return {
      success: false,
      error: "플랫폼을 자동으로 감지할 수 없습니다. YouTube 또는 SOOP(아프리카TV) URL을 입력해주세요.",
    };
  }

  // 2) 채널 ID 추출
  let youtubeChannelId: string | null = null;
  let soopBJId: string | null = null;

  if (platform === "youtube") {
    youtubeChannelId = extractYouTubeChannelId(input.channelUrl);
    if (!youtubeChannelId) {
      return {
        success: false,
        error: "YouTube 채널 ID를 추출할 수 없습니다. 올바른 YouTube 채널 URL을 입력해주세요.",
      };
    }
  } else if (platform === "soop") {
    soopBJId = extractSoopBJId(input.channelUrl);
    if (!soopBJId) {
      return {
        success: false,
        error: "SOOP BJ ID를 추출할 수 없습니다. 올바른 아프리카TV 채널 URL을 입력해주세요.",
      };
    }
  }

  // 3) 중복 체크 (같은 채널 URL이 이미 있는지)
  const { data: existing } = await supabase
    .from("bjs")
    .select("id, name")
    .eq("channel_url", input.channelUrl)
    .single();

  if (existing) {
    return {
      success: false,
      error: `이미 등록된 BJ입니다: ${existing.name}`,
    };
  }

  // 4) BJ 추가
  const { data: newBJ, error: bjError } = await supabase
    .from("bjs")
    .insert({
      name: input.name,
      platform,
      channel_url: input.channelUrl,
      thumbnail_url: input.thumbnailUrl || null,
      youtube_channel_id: youtubeChannelId,
      soop_bj_id: soopBJId,
    })
    .select()
    .single();

  if (bjError || !newBJ) {
    console.error("Failed to add BJ:", bjError);
    return { success: false, error: bjError?.message || "BJ 추가에 실패했습니다." };
  }

  // 5) bj_stats 초기화 (초기 점수 설정)
  const initialScore = input.initialScore || 0;
  const { error: statsError } = await supabase.from("bj_stats").insert({
    bj_id: newBJ.id,
    current_score: initialScore,
    rank: 9999, // 초기 랭킹은 낮게 설정 (나중에 재계산)
    diff_from_yesterday: 0,
  });

  if (statsError) {
    console.error("Failed to initialize BJ stats:", statsError);
    // BJ는 추가되었지만 stats 초기화 실패 - 경고만 하고 성공으로 처리
  }

  // 6) live_streams 초기화
  await supabase.from("live_streams").insert({
    bj_id: newBJ.id,
    is_live: false,
    viewer_count: null,
    started_at: null,
  });

  revalidatePath("/ranking");
  revalidatePath("/admin/ranking");

  return {
    success: true,
    bjId: newBJ.id,
    message: `${input.name} BJ가 성공적으로 추가되었습니다.`,
  };
}

/**
 * BJ를 삭제합니다.
 */
export async function deleteBJ(bjId: string) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return { success: false, error: "Supabase가 설정되지 않았습니다." };
  }

  try {
    // bjs 테이블에서 삭제하면 CASCADE로 live_streams, bj_stats도 자동 삭제됨
    const { error } = await supabase.from("bjs").delete().eq("id", bjId);

    if (error) {
      console.error("Failed to delete BJ:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/ranking");
    revalidatePath("/admin/ranking");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete BJ:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * 모든 BJ 목록을 가져옵니다.
 */
export async function getAllBJs() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return { success: true, bjs: [] }; // Frontend 기반 모드
  }

  try {
    const { data, error } = await supabase
      .from("bjs")
      .select("id, name, platform, channel_url, thumbnail_url, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch BJs:", error);
      return { success: false, error: error.message, bjs: [] };
    }

    return { success: true, bjs: data || [] };
  } catch (error) {
    console.warn("Failed to get all BJs:", error);
    return { success: true, bjs: [] };
  }
}
