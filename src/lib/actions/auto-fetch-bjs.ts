"use server";

import { getSupabaseServerClient } from "../supabase-server";
import { extractYouTubeChannelId } from "../youtube-api";
import type { Platform } from "../../types/bj";

interface YouTubeChannel {
  id: string;
  snippet: {
    title: string;
    thumbnails: {
      default: { url: string };
      medium?: { url: string };
      high?: { url: string };
    };
  };
  statistics?: {
    subscriberCount?: string;
    videoCount?: string;
  };
}

/**
 * YouTube API를 사용하여 인기 라이브 방송 중인 채널을 자동으로 가져옵니다.
 */
export async function autoFetchPopularYouTubeChannels() {
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
  if (!YOUTUBE_API_KEY) {
    return {
      success: false,
      error: "YOUTUBE_API_KEY가 설정되지 않았습니다.",
      channels: [],
    };
  }

  try {
    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return {
        success: false,
        error: "Supabase가 설정되지 않았습니다. BJ 자동 가져오기는 Supabase가 필요합니다.",
        channels: [],
      };
    }

    // 1) YouTube API로 현재 라이브 방송 중인 비디오 검색
    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?` +
        `part=snippet&` +
        `eventType=live&` +
        `type=video&` +
        `maxResults=50&` +
        `order=viewCount&` +
        `key=${YOUTUBE_API_KEY}`
    );

    if (!searchResponse.ok) {
      const error = await searchResponse.json();
      return {
        success: false,
        error: error.error?.message || "YouTube API 호출 실패",
        channels: [],
      };
    }

    const searchData = await searchResponse.json();
    const videoItems = searchData.items || [];

    if (videoItems.length === 0) {
      return {
        success: true,
        message: "현재 라이브 방송 중인 채널이 없습니다.",
        channels: [],
      };
    }

    // 2) 채널 ID 추출 및 중복 제거
    const channelIds = new Set<string>();
    const channelMap = new Map<
      string,
      { channelId: string; title: string; thumbnail: string }
    >();

    for (const item of videoItems) {
      const channelId = item.snippet.channelId;
      if (channelId && !channelIds.has(channelId)) {
        channelIds.add(channelId);
        channelMap.set(channelId, {
          channelId,
          title: item.snippet.channelTitle,
          thumbnail:
            item.snippet.thumbnails?.high?.url ||
            item.snippet.thumbnails?.medium?.url ||
            item.snippet.thumbnails?.default?.url ||
            "",
        });
      }
    }

    // 3) 채널 상세 정보 가져오기
    const channelIdsArray = Array.from(channelIds);
    const channelsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?` +
        `part=snippet,statistics&` +
        `id=${channelIdsArray.join(",")}&` +
        `key=${YOUTUBE_API_KEY}`
    );

    if (!channelsResponse.ok) {
      return {
        success: false,
        error: "채널 정보를 가져오는데 실패했습니다.",
        channels: [],
      };
    }

    const channelsData = await channelsResponse.json();
    const channels: YouTubeChannel[] = channelsData.items || [];

    // 4) Supabase에 없는 채널만 추가
    const addedChannels: string[] = [];
    const skippedChannels: string[] = [];

    for (const channel of channels) {
      const channelId = channel.id;
      const channelInfo = channelMap.get(channelId);

      if (!channelInfo) continue;

      // 이미 등록된 채널인지 확인
      const { data: existing } = await supabase
        .from("bjs")
        .select("id, name")
        .or(`youtube_channel_id.eq.${channelId},channel_url.ilike.%${channelId}%`)
        .single();

      if (existing) {
        skippedChannels.push(channelInfo.title);
        continue;
      }

      // 채널 URL 생성
      const channelUrl = `https://www.youtube.com/channel/${channelId}`;

      // BJ 추가
      const { data: newBJ, error: bjError } = await supabase
        .from("bjs")
        .insert({
          name: channelInfo.title,
          platform: "youtube",
          channel_url: channelUrl,
          thumbnail_url: channelInfo.thumbnail,
          youtube_channel_id: channelId,
        })
        .select()
        .single();

      if (bjError || !newBJ) {
        console.error(`Failed to add BJ ${channelInfo.title}:`, bjError);
        continue;
      }

      // bj_stats 초기화
      await supabase.from("bj_stats").insert({
        bj_id: newBJ.id,
        current_score: 0,
        rank: 9999,
        diff_from_yesterday: 0,
      });

      // live_streams 초기화
      await supabase.from("live_streams").insert({
        bj_id: newBJ.id,
        is_live: false,
        viewer_count: null,
        started_at: null,
      });

      addedChannels.push(channelInfo.title);
    }

    return {
      success: true,
      message: `${addedChannels.length}개의 채널이 추가되었습니다.`,
      added: addedChannels,
      skipped: skippedChannels.length,
      total: channels.length,
    };
  } catch (error) {
    console.error("Failed to auto-fetch YouTube channels:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
      channels: [],
    };
  }
}

/**
 * SOOP(아프리카TV)에서 인기 라이브 방송 중인 BJ를 자동으로 가져옵니다.
 */
export async function autoFetchPopularSoopBJs() {
  try {
    const supabase = getSupabaseServerClient();

    // SOOP 인기 방송 페이지에서 데이터 가져오기
    // (실제 구현은 SOOP API 또는 스크래핑 필요)
    // 여기서는 기본 구조만 제공

    return {
      success: true,
      message: "SOOP 자동 가져오기는 준비 중입니다.",
      added: [],
      skipped: 0,
      total: 0,
    };
  } catch (error) {
    console.error("Failed to auto-fetch SOOP BJs:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
      channels: [],
    };
  }
}
