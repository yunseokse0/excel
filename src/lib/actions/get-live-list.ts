"use server";

import { getSupabaseServerClient } from "../supabase-server";
import { getYouTubeLiveStatus } from "../youtube-api";
import { getSoopLiveStatus } from "../soop-api";
import type { BJ } from "../../types/bj";

export interface LiveStreamInfo {
  bj: BJ;
  isLive: boolean;
  title?: string;
  thumbnailUrl?: string;
  viewerCount?: number;
  streamUrl?: string;
  startedAt?: string;
}

/**
 * Supabase에 등록된 모든 BJ의 현재 라이브 상태를 확인합니다.
 * Supabase가 없으면 YouTube와 SOOP API를 직접 호출하여 실시간 방송을 가져옵니다.
 */
export async function getCurrentLiveList() {
  const supabase = getSupabaseServerClient();
  const liveList: LiveStreamInfo[] = [];

  // Supabase가 있으면 등록된 BJ만 확인
  if (supabase) {
    let bjs: any[] = [];
    
    try {
      // 모든 BJ 가져오기
      const { data, error: bjError } = await supabase
        .from("bjs")
        .select("id, name, platform, channel_url, thumbnail_url, youtube_channel_id, soop_bj_id");

      if (bjError || !data) {
        console.error("Failed to fetch BJs:", bjError);
        return { success: false, error: "Failed to fetch BJs", liveList: [] };
      }
      
      bjs = data;
    } catch (error) {
      console.warn("Failed to get live list:", error);
      return { success: true, liveList: [] };
    }

    // 각 BJ의 라이브 상태 확인
    for (const bj of bjs) {
      let liveStatus: any = null;

      if (bj.platform === "youtube" && bj.youtube_channel_id) {
        liveStatus = await getYouTubeLiveStatus(bj.youtube_channel_id);
      } else if (bj.platform === "soop" && bj.soop_bj_id) {
        liveStatus = await getSoopLiveStatus(bj.soop_bj_id);
      }

      if (liveStatus?.isLive) {
        liveList.push({
          bj: {
            id: bj.id,
            name: bj.name,
            platform: bj.platform as "youtube" | "soop" | "panda",
            isLive: true,
            currentScore: 0,
            thumbnailUrl: liveStatus.thumbnailUrl || bj.thumbnail_url || "",
            channelUrl: bj.channel_url,
            streamUrl: liveStatus.videoId
              ? `https://www.youtube.com/watch?v=${liveStatus.videoId}`
              : liveStatus.broadcastNo
              ? `https://play.afreecatv.com/${bj.soop_bj_id}/${liveStatus.broadcastNo}`
              : undefined,
          },
          isLive: true,
          title: liveStatus.title,
          thumbnailUrl: liveStatus.thumbnailUrl || bj.thumbnail_url || undefined,
          viewerCount: liveStatus.viewerCount,
          streamUrl: liveStatus.videoId
            ? `https://www.youtube.com/watch?v=${liveStatus.videoId}`
            : liveStatus.broadcastNo
            ? `https://play.afreecatv.com/${bj.soop_bj_id}/${liveStatus.broadcastNo}`
            : undefined,
          startedAt: liveStatus.publishedAt || liveStatus.startedAt,
        });
      }
    }
  } else {
    // Frontend 기반 모드: YouTube와 SOOP API를 직접 호출하여 실시간 방송 검색
    // 제미나이 제안: Promise.all로 병렬 처리하여 응답 속도 최적화
    try {
      console.log("[LiveList] Fetching live streams in frontend-only mode (parallel)...");
      
      const [youtubeLives, soopLives] = await Promise.all([
        fetchYouTubeLiveStreams(),
        fetchSoopLiveStreams(),
      ]);
      
      console.log(`[LiveList] Found ${youtubeLives.length} YouTube live streams`);
      console.log(`[LiveList] Found ${soopLives.length} SOOP live streams`);
      
      liveList.push(...youtubeLives);
      liveList.push(...soopLives);
      
      console.log(`[LiveList] Total live streams: ${liveList.length}`);
    } catch (error) {
      console.error("[LiveList] Failed to fetch live streams:", error);
    }
  }

  // 시청자 수 기준으로 정렬
  liveList.sort((a, b) => (b.viewerCount || 0) - (a.viewerCount || 0));

  return { success: true, liveList };
}

/**
 * YouTube API를 사용하여 현재 라이브 중인 방송을 검색합니다.
 */
async function fetchYouTubeLiveStreams(): Promise<LiveStreamInfo[]> {
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
  if (!YOUTUBE_API_KEY) {
    console.warn("[YouTube] YOUTUBE_API_KEY is not set in environment variables");
    return [];
  }

  try {
    // 1단계: Search API로 후보군 추출
    const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
    searchUrl.searchParams.set("part", "snippet");
    searchUrl.searchParams.set("eventType", "live");
    searchUrl.searchParams.set("type", "video");
    searchUrl.searchParams.set("maxResults", "50");
    searchUrl.searchParams.set("order", "viewCount");
    searchUrl.searchParams.set("key", YOUTUBE_API_KEY);

    console.log("[YouTube] Step 1: Fetching live streams from search API...");
    const searchRes = await fetch(searchUrl.toString(), { 
      cache: "no-store",
      next: { revalidate: 0 }
    });
    
    if (!searchRes.ok) {
      const errorText = await searchRes.text();
      let errorData: any = {};
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      
      console.error("[YouTube] API search failed:", searchRes.status, errorData);
      
      // API 키 관련 에러인지 확인
      if (searchRes.status === 403 || searchRes.status === 401) {
        console.error("[YouTube] API 키가 유효하지 않거나 할당량을 초과했습니다.");
        console.error("[YouTube] Error details:", errorData);
      }
      
      return [];
    }

    const searchData = await searchRes.json();
    const videoItems = searchData.items || [];

    console.log(`[YouTube] Found ${videoItems.length} videos from search API`);
    
    if (videoItems.length === 0) {
      console.warn("[YouTube] No videos found from search API. This might mean:");
      console.warn("  1. No live broadcasts currently");
      console.warn("  2. API key issue");
      console.warn("  3. API quota exceeded");
      return [];
    }
    
    // 샘플 검색 결과 확인
    console.log(`[YouTube] Sample search results (first 3):`);
    videoItems.slice(0, 3).forEach((item: any, idx: number) => {
      console.log(`  ${idx + 1}. ${item.snippet?.title?.substring(0, 60)} - ${item.snippet?.channelTitle}`);
    });

    // 비디오 ID 목록 추출 (유효한 ID만)
    const videoIds = videoItems
      .map((item: any) => item.id?.videoId)
      .filter((id: string) => id)
      .join(",");

    if (!videoIds) {
      console.warn("[YouTube] No valid video IDs found from search");
      return [];
    }

    console.log(`[YouTube] Step 2: Fetching details for ${videoIds.split(",").length} videos...`);

    // 2단계: Videos API로 상세 정보(시청자 수 등) 가져오기 - 제미나이 제안대로
    const videoUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
    videoUrl.searchParams.set("part", "snippet,liveStreamingDetails,statistics");
    videoUrl.searchParams.set("id", videoIds);
    videoUrl.searchParams.set("key", YOUTUBE_API_KEY);

    const videoRes = await fetch(videoUrl.toString(), { 
      cache: "no-store",
      next: { revalidate: 0 }
    });
    
    if (!videoRes.ok) {
      const errorText = await videoRes.text();
      console.error("[YouTube] Failed to fetch video details:", videoRes.status, errorText);
      return [];
    }

    const videoData = await videoRes.json();
    const videos = videoData.items || [];
    
    console.log(`[YouTube] Fetched ${videos.length} video details`);
    
    if (videos.length === 0) {
      console.warn("[YouTube] No video details returned from API");
      return [];
    }
    
    // 샘플 비디오 정보 확인
    if (videos.length > 0) {
      const sample = videos[0];
      console.log(`[YouTube] Sample video details:`, {
        id: sample.id,
        title: sample.snippet?.title?.substring(0, 50),
        channelTitle: sample.snippet?.channelTitle,
        liveBroadcastContent: sample.snippet?.liveBroadcastContent,
        hasLiveDetails: !!sample.liveStreamingDetails,
        concurrentViewers: sample.liveStreamingDetails?.concurrentViewers,
        actualStartTime: sample.liveStreamingDetails?.actualStartTime,
      });
    }

    // 제미나이 제안: 실제 라이브 방송만 필터링 (엄격한 조건)
    const liveVideos = videos.filter((video: any) => {
      // 1. liveBroadcastContent가 "live"인지 확인
      if (video.snippet?.liveBroadcastContent !== "live") {
        return false;
      }
      
      // 2. liveStreamingDetails가 존재해야 함 (필수)
      if (!video.liveStreamingDetails) {
        return false;
      }
      
      // 3. actualEndTime이 있으면 종료된 방송 (제외)
      if (video.liveStreamingDetails.actualEndTime) {
        return false;
      }
      
      // 4. actualStartTime은 있고 actualEndTime은 없는 데이터가 진짜 "현재 라이브" (제미나이 제안)
      const hasActualStart = video.liveStreamingDetails.actualStartTime !== undefined;
      const hasActualEnd = video.liveStreamingDetails.actualEndTime !== undefined;
      
      if (hasActualStart && !hasActualEnd) {
        return true; // 확실히 라이브 중
      }
      
      // 5. scheduledStartTime만 있고 actualStartTime이 없으면 예정된 방송 (제외)
      if (video.liveStreamingDetails.scheduledStartTime && !hasActualStart) {
        return false;
      }
      
      // 6. concurrentViewers가 있으면 라이브로 간주
      if (video.liveStreamingDetails.concurrentViewers !== undefined) {
        return true;
      }
      
      return false;
    });

    console.log(`[YouTube] Filtered to ${liveVideos.length} live streams (from ${videos.length} total videos)`);

    if (liveVideos.length === 0) {
      console.warn("[YouTube] No live streams after filtering. Checking all videos...");
      // 디버깅: 모든 비디오의 상세 정보 확인
      videos.forEach((video: any, index: number) => {
        const details = video.liveStreamingDetails || {};
        console.log(`[YouTube] Video ${index + 1}:`, {
          liveBroadcastContent: video.snippet?.liveBroadcastContent,
          title: video.snippet?.title?.substring(0, 50),
          channelTitle: video.snippet?.channelTitle,
          hasLiveDetails: !!video.liveStreamingDetails,
          concurrentViewers: details.concurrentViewers,
          actualStartTime: details.actualStartTime,
          actualEndTime: details.actualEndTime,
          scheduledStartTime: details.scheduledStartTime,
        });
      });
      return [];
    }
    
    // 샘플 라이브 비디오 확인
    if (liveVideos.length > 0) {
      const sample = liveVideos[0];
      console.log(`[YouTube] Sample live video:`, {
        id: sample.id,
        title: sample.snippet?.title?.substring(0, 50),
        channelTitle: sample.snippet?.channelTitle,
        viewerCount: sample.liveStreamingDetails?.concurrentViewers,
      });
    }

    // 라이브 비디오를 LiveStreamInfo로 매핑
    const result = liveVideos.map((video: any) => {
      // 시청자 수 파싱 (문자열일 수 있음)
      let viewerCount: number | undefined = undefined;
      if (video.liveStreamingDetails?.concurrentViewers !== undefined) {
        const viewers = video.liveStreamingDetails.concurrentViewers;
        viewerCount = typeof viewers === "string" ? parseInt(viewers, 10) : Number(viewers);
        if (isNaN(viewerCount)) viewerCount = undefined;
      }

      // 썸네일 URL (최고 품질 우선)
      const thumbnailUrl = video.snippet?.thumbnails?.maxres?.url || 
                          video.snippet?.thumbnails?.high?.url || 
                          video.snippet?.thumbnails?.medium?.url ||
                          video.snippet?.thumbnails?.default?.url ||
                          "";

      // 시작 시간 결정
      const startedAt = video.liveStreamingDetails?.actualStartTime || 
                       video.liveStreamingDetails?.scheduledStartTime ||
                       video.snippet?.publishedAt ||
                       undefined;

      return {
        bj: {
          id: `youtube-${video.snippet?.channelId || "unknown"}-${video.id}`, // 고유 ID
          name: video.snippet?.channelTitle || "Unknown Channel",
          platform: "youtube" as const,
          isLive: true,
          currentScore: 0,
          thumbnailUrl: thumbnailUrl || "",
          channelUrl: video.snippet?.channelId 
            ? `https://www.youtube.com/channel/${video.snippet.channelId}`
            : `https://www.youtube.com/watch?v=${video.id}`,
          streamUrl: `https://www.youtube.com/watch?v=${video.id}`,
        },
        isLive: true,
        title: video.snippet?.title || "Untitled Live Stream",
        thumbnailUrl: thumbnailUrl || undefined,
        viewerCount,
        streamUrl: `https://www.youtube.com/watch?v=${video.id}`,
        startedAt,
      };
    });

    console.log(`[YouTube] Successfully mapped ${result.length} live streams`);
    if (result.length > 0) {
      console.log(`[YouTube] Sample result:`, {
        name: result[0].bj.name,
        title: result[0].title?.substring(0, 50),
        viewerCount: result[0].viewerCount,
      });
    }

    return result;
  } catch (error) {
    console.error("Failed to fetch YouTube live streams:", error);
    return [];
  }
}

/**
 * SOOP(아프리카TV) API를 사용하여 현재 라이브 중인 방송을 검색합니다.
 */
async function fetchSoopLiveStreams(): Promise<LiveStreamInfo[]> {
  try {
    console.log("[SOOP] Fetching live streams...");
    
    // 제미나이 제안: 아프리카TV 비공식 API 엔드포인트 (여러 개 시도)
    const apiEndpoints = [
      "https://live.afreecatv.com/afreeca/live_list.php", // 제미나이 제안 엔드포인트
      "https://bjapi.afreecatv.com/api/main/broad_list",
      "https://live.afreecatv.com/api/main/broad_list",
      "https://bj.afreecatv.com/api/main/broad_list",
      "https://st.afreecatv.com/api/main/broad_list",
    ];

    let broadcasts: any[] = [];
    let lastError: Error | null = null;

    // 각 엔드포인트를 시도
    for (const apiUrl of apiEndpoints) {
      try {
        console.log(`[SOOP] Trying endpoint: ${apiUrl}`);
        
        // 제미나이 제안: User-Agent를 일반 브라우저처럼 설정하여 403 Forbidden 방지
        const res = await fetch(apiUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
            "Referer": "https://www.afreecatv.com/",
            "Origin": "https://www.afreecatv.com",
          },
          cache: "no-store",
          next: { revalidate: 0 },
        });

        if (!res.ok) {
          console.warn(`[SOOP] Endpoint ${apiUrl} failed: ${res.status} ${res.statusText}`);
          continue;
        }

        const data = await res.json() as any;
        console.log(`[SOOP] Response structure keys:`, Object.keys(data));
        console.log(`[SOOP] Response sample (first 200 chars):`, JSON.stringify(data).substring(0, 200));
        
        // 다양한 응답 구조 지원
        if (data.broad_list && Array.isArray(data.broad_list)) {
          broadcasts = data.broad_list;
          console.log(`[SOOP] ✓ Found ${broadcasts.length} broadcasts from broad_list`);
          if (broadcasts.length > 0) {
            console.log(`[SOOP] Sample broadcast:`, {
              user_id: broadcasts[0].user_id,
              user_nick: broadcasts[0].user_nick,
              broad_state: broadcasts[0].broad_state,
              broad_title: broadcasts[0].broad_title?.substring(0, 50),
            });
          }
          break;
        } else if (data.list && Array.isArray(data.list)) {
          broadcasts = data.list;
          console.log(`[SOOP] ✓ Found ${broadcasts.length} broadcasts from list`);
          break;
        } else if (data.data && Array.isArray(data.data)) {
          broadcasts = data.data;
          console.log(`[SOOP] ✓ Found ${broadcasts.length} broadcasts from data`);
          break;
        } else if (Array.isArray(data)) {
          broadcasts = data;
          console.log(`[SOOP] ✓ Found ${broadcasts.length} broadcasts from array`);
          break;
        } else {
          console.warn(`[SOOP] ✗ Unexpected response structure from ${apiUrl}`);
          console.warn(`[SOOP] Full response:`, JSON.stringify(data).substring(0, 500));
        }
      } catch (error) {
        console.warn(`[SOOP] Error fetching from ${apiUrl}:`, error);
        lastError = error instanceof Error ? error : new Error(String(error));
        continue;
      }
    }

    if (broadcasts.length === 0) {
      console.warn("[SOOP] No broadcasts found from any endpoint");
      if (lastError) {
        console.error("[SOOP] Last error:", lastError);
      }
      
      // 대체 방법: 인기 방송 페이지 크롤링 시도
      return await fetchSoopLiveStreamsFromHTML();
    }

    console.log(`[SOOP] Found ${broadcasts.length} total broadcasts, filtering live ones...`);

    // 제미나이 제안: SOOP 필터링 조건 (broad_status === '1' 또는 ON_AIR)
    const liveStreams = broadcasts
      .filter((broad: any) => {
        // 다양한 필드명 지원 - 라이브 상태 확인
        const isLive = 
          broad.broad_state === "ON_AIR" ||
          broad.status === "ON_AIR" ||
          broad.broad_status === "ON_AIR" ||
          broad.broad_status === "1" || // 제미나이 제안
          broad.is_live === true ||
          broad.isLive === true ||
          broad.broad_state === "LIVE";
        
        if (!isLive) {
          return false;
        }
        
        // user_id 또는 bj_id가 있어야 함
        const hasUserId = !!(broad.user_id || broad.bj_id || broad.userId);
        if (!hasUserId) {
          console.warn(`[SOOP] Broadcast missing user_id:`, Object.keys(broad));
          return false;
        }
        
        return true;
      })
      .map((broad: any) => {
        // 제미나이 제안: SOOP 응답 구조 매핑
        const userId = broad.user_id || broad.bj_id || broad.userId || "unknown";
        const userNick = broad.user_nick || broad.user_nickname || broad.nickname || broad.user_nick || userId;
        const broadNo = broad.broad_no || broad.broadcast_no || broad.broadNo || broad.broad_no;
        const broadTitle = broad.broad_title || broad.title || `${userNick}의 방송`;
        
        // 제미나이 제안: 썸네일 URL은 broad_no 기반 조합
        // https://snapshot.afreecatv.com/live/snapshot/${broad_no}.jpg
        let thumbnail = broad.thumbnail || broad.thumbnail_url || broad.img || broad.thumbnail_small || "";
        if (!thumbnail && broadNo) {
          thumbnail = `https://snapshot.afreecatv.com/live/snapshot/${broadNo}.jpg`;
        }
        
        // 제미나이 제안: 시청자 수 필드 (total_view_cnt)
        const viewerCount = broad.total_view_cnt || broad.viewer_count || broad.viewerCount || broad.view_cnt || broad.total_viewer_cnt;
        const broadStart = broad.broad_start || broad.start_time || broad.started_at || broad.broad_start_time;

        // 시청자 수 파싱
        let parsedViewerCount: number | undefined = undefined;
        if (viewerCount !== undefined && viewerCount !== null) {
          parsedViewerCount = typeof viewerCount === "string" 
            ? parseInt(viewerCount, 10) 
            : Number(viewerCount);
          if (isNaN(parsedViewerCount)) parsedViewerCount = undefined;
        }

        return {
          bj: {
            id: `soop-${userId}-${broadNo || Date.now()}`, // 고유 ID 생성
            name: userNick,
            platform: "soop" as const,
            isLive: true,
            currentScore: 0,
            thumbnailUrl: thumbnail || "",
            channelUrl: `https://bj.afreecatv.com/${userId}`,
            streamUrl: broadNo
              ? `https://play.afreecatv.com/${userId}/${broadNo}`
              : undefined,
          },
          isLive: true,
          title: broadTitle,
          thumbnailUrl: thumbnail || undefined,
          viewerCount: parsedViewerCount,
          streamUrl: broadNo
            ? `https://play.afreecatv.com/${userId}/${broadNo}`
            : undefined,
          startedAt: broadStart,
        };
      });

    console.log(`[SOOP] Filtered to ${liveStreams.length} live streams`);
    
    // 샘플 데이터 확인
    if (liveStreams.length > 0) {
      console.log(`[SOOP] Sample live stream:`, {
        name: liveStreams[0].bj.name,
        title: liveStreams[0].title?.substring(0, 50),
        viewerCount: liveStreams[0].viewerCount,
      });
    }

    return liveStreams;
  } catch (error) {
    console.error("[SOOP] Failed to fetch live streams:", error);
    // HTML 크롤링으로 폴백
    return await fetchSoopLiveStreamsFromHTML();
  }
}

/**
 * HTML 크롤링으로 SOOP 라이브 방송 가져오기 (폴백)
 */
async function fetchSoopLiveStreamsFromHTML(): Promise<LiveStreamInfo[]> {
  try {
    console.log("[SOOP] Trying HTML fallback method...");
    
    // 아프리카TV 인기 방송 페이지
    const htmlUrl = "https://www.afreecatv.com/";
    
    const res = await fetch(htmlUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`[SOOP] HTML fetch failed: ${res.status}`);
      return [];
    }

    const html = await res.text();
    
    // 간단한 JSON 데이터 추출 시도 (일부 페이지는 JSON 데이터를 포함)
    const jsonMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({.+?});/);
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[1]);
        console.log("[SOOP] Found JSON data in HTML");
        // 데이터 구조에 따라 파싱
        // 실제 구조는 페이지마다 다를 수 있음
      } catch {
        // JSON 파싱 실패
      }
    }

    // HTML 크롤링은 복잡하므로 일단 빈 배열 반환
    console.warn("[SOOP] HTML fallback not fully implemented, returning empty array");
    return [];
  } catch (error) {
    console.error("[SOOP] HTML fallback failed:", error);
    return [];
  }
}

/**
 * 특정 플랫폼의 라이브 방송만 가져옵니다.
 */
export async function getLiveListByPlatform(platform: "youtube" | "soop") {
  const result = await getCurrentLiveList();
  if (!result.success) {
    return result;
  }

  const filtered = result.liveList.filter((item) => item.bj.platform === platform);
  return { success: true, liveList: filtered };
}
