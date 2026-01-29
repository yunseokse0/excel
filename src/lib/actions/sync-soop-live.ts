"use server";

import { getSupabaseServerClient } from "../supabase-server";
import { getSoopLiveStatus, extractSoopBJId } from "../soop-api";

/**
 * 특정 BJ의 SOOP 라이브 상태를 동기화합니다.
 * @param bjId Supabase bjs 테이블의 BJ ID
 * @returns 성공 여부
 */
export async function syncSoopLiveForBJ(bjId: string) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return { success: false, error: "Supabase가 설정되지 않았습니다." };
  }

  try {
    // 1) BJ 정보 가져오기
    const { data: bj, error: bjError } = await supabase
    .from("bjs")
    .select("id, name, platform, channel_url, soop_bj_id")
    .eq("id", bjId)
    .single();

  if (bjError || !bj) {
    console.error("Failed to fetch BJ:", bjError);
    return { success: false, error: "BJ not found" };
  }

  if (bj.platform !== "soop") {
    return { success: false, error: "BJ is not a SOOP channel" };
  }

  // 2) SOOP BJ ID 추출 또는 사용
  let soopBJId = bj.soop_bj_id;
  if (!soopBJId && bj.channel_url) {
    soopBJId = extractSoopBJId(bj.channel_url);
    // 추출한 BJ ID를 DB에 저장
    if (soopBJId) {
      await supabase
        .from("bjs")
        .update({ soop_bj_id: soopBJId })
        .eq("id", bjId);
    }
  }

  if (!soopBJId) {
    return {
      success: false,
      error:
        "SOOP BJ ID not found. Please set soop_bj_id or channel_url.",
    };
  }

  // 3) SOOP API로 라이브 상태 확인
  const liveStatus = await getSoopLiveStatus(soopBJId);

  if (!liveStatus) {
    return { success: false, error: "Failed to fetch SOOP live status" };
  }

  // 4) live_streams 테이블에 업데이트 또는 삽입
  const { error: streamError } = await supabase
    .from("live_streams")
    .upsert(
      {
        bj_id: bjId,
        is_live: liveStatus.isLive,
        stream_url: liveStatus.isLive && liveStatus.broadcastNo
          ? `https://play.afreecatv.com/${soopBJId}/${liveStatus.broadcastNo}`
          : null,
        viewer_count: liveStatus.viewerCount ?? null,
        started_at: liveStatus.startedAt ?? null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "bj_id",
      }
    );

    if (streamError) {
      console.error("Failed to update live_streams:", streamError);
      return { success: false, error: streamError.message };
    }

    return {
      success: true,
      isLive: liveStatus.isLive,
      broadcastNo: liveStatus.broadcastNo,
    };
  } catch (error) {
    console.error("Failed to sync SOOP live:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * 모든 SOOP BJ의 라이브 상태를 일괄 동기화합니다.
 * @returns 동기화 결과 요약
 */
export async function syncAllSoopLives() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return {
      success: false,
      error: "Supabase가 설정되지 않았습니다.",
      synced: 0,
      total: 0,
    };
  }

  try {
    // SOOP 플랫폼의 모든 BJ 가져오기
    const { data: bjs, error } = await supabase
      .from("bjs")
      .select("id")
      .eq("platform", "soop");

    if (error || !bjs) {
      console.error("Failed to fetch SOOP BJs:", error);
      return {
        success: false,
        error: "Failed to fetch SOOP BJs",
        synced: 0,
        total: 0,
      };
    }

    const results = await Promise.allSettled(
      bjs.map((bj) => syncSoopLiveForBJ(bj.id))
    );

    const successful = results.filter(
      (r) => r.status === "fulfilled" && r.value.success
    ).length;

    return {
      success: true,
      synced: successful,
      total: bjs.length,
    };
  } catch (error) {
    console.error("Failed to sync all SOOP lives:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      synced: 0,
      total: 0,
    };
  }
}
