"use server";

import { getSupabaseServerClient } from "../supabase-server";
import { getYouTubeLiveStatus, extractYouTubeChannelId } from "../youtube-api";

/**
 * 특정 BJ의 YouTube 라이브 상태를 동기화합니다.
 * @param bjId Supabase bjs 테이블의 BJ ID
 * @returns 성공 여부
 */
export async function syncYouTubeLiveForBJ(bjId: string) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return { success: false, error: "Supabase가 설정되지 않았습니다." };
  }

  try {
    // 1) BJ 정보 가져오기
    const { data: bj, error: bjError } = await supabase
    .from("bjs")
    .select("id, name, platform, channel_url, youtube_channel_id")
    .eq("id", bjId)
    .single();

  if (bjError || !bj) {
    console.error("Failed to fetch BJ:", bjError);
    return { success: false, error: "BJ not found" };
  }

  if (bj.platform !== "youtube") {
    return { success: false, error: "BJ is not a YouTube channel" };
  }

  // 2) YouTube 채널 ID 추출 또는 사용
  let channelId = bj.youtube_channel_id;
  if (!channelId && bj.channel_url) {
    channelId = extractYouTubeChannelId(bj.channel_url);
    // 추출한 채널 ID를 DB에 저장 (다음번부터 재사용)
    if (channelId) {
      await supabase
        .from("bjs")
        .update({ youtube_channel_id: channelId })
        .eq("id", bjId);
    }
  }

  if (!channelId) {
    return {
      success: false,
      error: "YouTube channel ID not found. Please set youtube_channel_id or channel_url.",
    };
  }

  // 3) YouTube API로 라이브 상태 확인
  const liveStatus = await getYouTubeLiveStatus(channelId);

  if (!liveStatus) {
    return { success: false, error: "Failed to fetch YouTube live status" };
  }

  // 4) live_streams 테이블에 업데이트 또는 삽입
  const { error: streamError } = await supabase
    .from("live_streams")
    .upsert(
      {
        bj_id: bjId,
        is_live: liveStatus.isLive,
        stream_url: liveStatus.isLive
          ? `https://www.youtube.com/watch?v=${liveStatus.videoId}`
          : null,
        viewer_count: liveStatus.viewerCount ?? null,
        started_at: liveStatus.publishedAt ?? null,
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
      videoId: liveStatus.videoId,
    };
  } catch (error) {
    console.error("Failed to sync YouTube live:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * 모든 YouTube BJ의 라이브 상태를 일괄 동기화합니다.
 * @returns 동기화 결과 요약
 */
export async function syncAllYouTubeLives() {
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
    // YouTube 플랫폼의 모든 BJ 가져오기
    const { data: bjs, error } = await supabase
      .from("bjs")
      .select("id")
      .eq("platform", "youtube");

    if (error || !bjs) {
      console.error("Failed to fetch YouTube BJs:", error);
      return {
        success: false,
        error: "Failed to fetch YouTube BJs",
        synced: 0,
        total: 0,
      };
    }

    const results = await Promise.allSettled(
      bjs.map((bj) => syncYouTubeLiveForBJ(bj.id))
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
    console.error("Failed to sync all YouTube lives:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      synced: 0,
      total: 0,
    };
  }
}
