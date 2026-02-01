"use server";

import { getSupabaseServerClient } from "../supabase-server";
import { getYouTubeLiveStatus } from "../youtube-api";
import type { BJ } from "../../types/bj";
import type { DetectedCategory } from "../domain/category";
import { matchCategories, getPrimaryCategory } from "../domain/category";
import { getActiveCategoryRules, DEFAULT_CATEGORY_ID } from "../config/categories";

/**
 * Live stream information with category detection.
 * 
 * This structure supports multiple categories per stream,
 * allowing the platform to handle various content types.
 */
export interface LiveStreamInfo {
  bj: BJ;
  isLive: boolean;
  title?: string;
  thumbnailUrl?: string;
  viewerCount?: number;
  streamUrl?: string;
  startedAt?: string;
  /** Detected categories for this stream (multiple categories possible) */
  detectedCategories?: DetectedCategory[];
  /** Primary category ID (highest confidence) */
  primaryCategoryId?: string;
}

/**
 * Get current live streams from all platforms.
 * 
 * This function uses a category-based rule engine to filter streams.
 * The system is designed as a platform that can manage multiple categories,
 * not just a single-purpose fan page.
 * 
 * Category rules are defined in src/lib/config/categories.ts
 * and can be extended to support additional content types.
 * 
 * @returns Live streams matched to active category rules
 */
export async function getCurrentLiveList() {
  const supabase = getSupabaseServerClient();
  const liveList: LiveStreamInfo[] = [];
  let isUsingMockData = false; // 함수 전체에서 사용할 수 있도록 상단에 선언

  console.log("[LiveList] 🚀 Starting getCurrentLiveList()");
  console.log("[LiveList] Supabase status:", supabase ? "✅ Connected" : "❌ Not configured");

  // Supabase가 있으면 등록된 BJ만 확인
  if (supabase) {
    let bjs: any[] = [];
    
    try {
      // 모든 BJ 가져오기
      const { data, error: bjError } = await supabase
        .from("bjs")
        .select("id, name, platform, channel_url, thumbnail_url, youtube_channel_id");

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
      }

      if (liveStatus?.isLive) {
        liveList.push({
          bj: {
            id: bj.id,
            name: bj.name,
            platform: bj.platform as "youtube",
            isLive: true,
            currentScore: 0,
            thumbnailUrl: liveStatus.thumbnailUrl || bj.thumbnail_url || "",
            channelUrl: bj.channel_url,
            streamUrl: liveStatus.videoId
              ? `https://www.youtube.com/watch?v=${liveStatus.videoId}`
              : undefined,
          },
          isLive: true,
          title: liveStatus.title,
          thumbnailUrl: liveStatus.thumbnailUrl || bj.thumbnail_url || undefined,
          viewerCount: liveStatus.viewerCount,
          streamUrl: liveStatus.videoId
            ? `https://www.youtube.com/watch?v=${liveStatus.videoId}`
            : undefined,
          startedAt: liveStatus.publishedAt || liveStatus.startedAt,
        });
      }
    }
  } else {
    // Frontend 기반 모드: YouTube API를 직접 호출하여 실시간 방송 검색
    try {
      console.log("[LiveList] 🔄 Fetching live streams in frontend-only mode...");
      console.log("[LiveList] Environment check:");
      console.log(`  - YOUTUBE_API_KEY: ${process.env.YOUTUBE_API_KEY ? `✅ Set (${process.env.YOUTUBE_API_KEY.length} chars)` : "❌ NOT SET"}`);
      
      const hasYoutubeKey = !!process.env.YOUTUBE_API_KEY;
      
      const youtubeLives = await fetchYouTubeLiveStreams().catch((err) => {
        console.error("[LiveList] ❌ YouTube fetch failed:", err);
        if (err instanceof Error) {
          console.error("[LiveList] YouTube error message:", err.message);
          console.error("[LiveList] YouTube error stack:", err.stack);
        }
        console.error("[LiveList] ⚠️ YouTube API 호출 실패 - 할당량 초과 또는 API 키 문제일 수 있습니다");
        return [];
      });
      
      // 상세 로깅
      console.log(`[LiveList] 📊 Fetch results:`);
      console.log(`  - YouTube: ${youtubeLives.length} streams`);
      console.log(`  - Total before filtering: ${youtubeLives.length}`);
      
      console.log(`[LiveList] ✅ Found ${youtubeLives.length} YouTube live streams`);
      if (youtubeLives.length === 0 && hasYoutubeKey) {
        console.warn("[LiveList] ⚠️ YouTube API key is set but no live streams found");
        console.warn("[LiveList] Possible reasons:");
        console.warn("  1. No live broadcasts currently on YouTube");
        console.warn("  2. API quota exceeded (check Google Cloud Console)");
        console.warn("  3. API key doesn't have YouTube Data API v3 enabled");
        console.warn("  4. API key is invalid or restricted");
        console.warn("  5. Check server logs above for detailed YouTube API errors");
      }
      
      // API 키가 없고 개발 환경이면 mock 데이터일 가능성이 높음
      if (!hasYoutubeKey && process.env.NODE_ENV === "development") {
        if (youtubeLives.length > 0) {
          console.warn("[LiveList] ⚠️ API key missing but data found - likely mock data");
          isUsingMockData = true;
        }
      }
      
      liveList.push(...youtubeLives);
      
      console.log(`[LiveList] ✅ Total live streams before filtering: ${liveList.length}`);
      console.log(`[LiveList] 📊 Breakdown:`);
      console.log(`  - YouTube: ${youtubeLives.length} streams`);
      
      // 각 플랫폼의 샘플 데이터 확인
      if (youtubeLives.length > 0) {
        console.log(`[LiveList] 📺 YouTube sample:`, {
          name: youtubeLives[0].bj.name,
          title: youtubeLives[0].title?.substring(0, 50),
          viewers: youtubeLives[0].viewerCount,
        });
      }
      
      if (liveList.length === 0) {
        console.warn("[LiveList] ⚠️ No live streams found from any platform");
        console.warn("[LiveList] 🔍 Troubleshooting:");
        console.warn("  1. YouTube API key: Check .env.local file");
        console.warn("  2. API key format: YOUTUBE_API_KEY=your_actual_key_here (no quotes)");
        console.warn("  3. Server restart: Restart dev server after adding API key");
        console.warn("  4. Live broadcasts: There might not be any live broadcasts right now");
        console.warn("  5. Check server logs above for detailed error messages");
        
        // No mock data fallback - return empty list if no streams found
        console.warn("[LiveList] ⚠️ No live streams found");
        console.warn("[LiveList] This might mean:");
        console.warn("  1. No live broadcasts currently on YouTube");
        console.warn("  2. API quota exceeded (check Google Cloud Console)");
        console.warn("  3. API key is invalid or restricted");
        console.warn("  4. Check server logs above for detailed errors");
      }
    } catch (error) {
      console.error("[LiveList] ❌ Failed to fetch live streams:", error);
      if (error instanceof Error) {
        console.error("[LiveList] Error details:", error.message, error.stack);
      }
      
      // No mock data fallback - return empty list on error
      console.error("[LiveList] ❌ Error occurred - check error details above");
    }
  }

  // 최종 정렬: 엑셀 방송 우선 → 한국어 방송 → 시청자 수
  const koreanPattern = /[가-힣]/;
  liveList.sort((a, b) => {
    // 1순위: 엑셀 방송 매칭 여부
    const aIsExcel = a.primaryCategoryId === DEFAULT_CATEGORY_ID;
    const bIsExcel = b.primaryCategoryId === DEFAULT_CATEGORY_ID;
    if (aIsExcel && !bIsExcel) return -1;
    if (!aIsExcel && bIsExcel) return 1;
    
    // 2순위: 한국어 방송
    const aIsKorean = koreanPattern.test(a.title || "") || koreanPattern.test(a.bj.name || "");
    const bIsKorean = koreanPattern.test(b.title || "") || koreanPattern.test(b.bj.name || "");
    if (aIsKorean && !bIsKorean) return -1;
    if (!aIsKorean && bIsKorean) return 1;
    
    // 3순위: 시청자 수
    return (b.viewerCount || 0) - (a.viewerCount || 0);
  });

  console.log(`[LiveList] ✅ Final result: ${liveList.length} live streams`);
  
  // No mock data fallback - return empty list if no streams found
  if (liveList.length === 0) {
    console.warn("[LiveList] ⚠️ No live streams found");
    console.warn("[LiveList] 🔍 진단 정보:");
    console.warn(`  - Supabase 설정: ${supabase ? "✅ 있음" : "❌ 없음 (프론트엔드 모드)"}`);
    console.warn(`  - YouTube API 키: ${process.env.YOUTUBE_API_KEY ? `✅ 있음 (${process.env.YOUTUBE_API_KEY.length}자)` : "❌ 없음"}`);
    console.warn(`  - YouTube 할당량 초과: ${youtubeQuotaExceeded ? "⚠️ 예 (24시간 후 재시도)" : "✅ 정상"}`);
    console.warn("[LiveList] 💡 가능한 원인:");
    console.warn("  1. YouTube API 할당량 초과 - Google Cloud Console에서 확인");
    console.warn("  2. 현재 실제로 방송 중인 BJ가 없음");
    console.warn("  3. 필터링 로직이 너무 엄격함 - 위의 필터링 로그 확인");
    console.warn("[LiveList] Check server logs above for detailed error messages");
    
    // 진단 정보를 반환값에 포함 (API Route에서 사용)
    return { 
      success: true, 
      liveList: [], 
      isMock: false,
      diagnosticInfo: {
        hasSupabase: !!supabase,
        hasYoutubeKey: !!process.env.YOUTUBE_API_KEY,
        youtubeQuotaExceeded,
        mode: supabase ? "supabase" : "frontend-only",
      }
    };
  }
  
  // isUsingMockData 플래그는 더 이상 사용하지 않음 (mock 데이터 제거)
  const finalIsMock = false;
  
  if (finalIsMock) {
    console.warn("[LiveList] 🧪 Returning data with isMock=true (API key missing or using fallback)");
  }
  
  return { 
    success: true, 
    liveList, 
    isMock: finalIsMock,
    diagnosticInfo: liveList.length === 0 ? {
      hasSupabase: !!supabase,
      hasYoutubeKey: !!process.env.YOUTUBE_API_KEY,
      youtubeQuotaExceeded,
      mode: supabase ? "supabase" : "frontend-only",
    } : undefined,
  };
}

/**
 * Fetch live streams from YouTube using category-based filtering.
 * 
 * This function uses the category rule engine to match streams
 * against active category rules. The default category is used
 * for backward compatibility, but the system supports multiple categories.
 */
// 전역 변수로 할당량 초과 상태 추적
let youtubeQuotaExceeded = false;
let youtubeQuotaExceededTime = 0;
const QUOTA_RESET_HOURS = 24; // 할당량 리셋까지 대기 시간 (시간)

async function fetchYouTubeLiveStreams(): Promise<LiveStreamInfo[]> {
  try {
    console.log("[YouTube] Fetching live streams...");
    
    // Step 1: HTML 크롤링/스크래핑을 먼저 시도 (가장 신뢰할 수 있는 방법)
    console.log("[YouTube] 🔄 Step 1: Trying HTML scraping...");
    const scraperResult = await fetchYouTubeLiveStreamsWithScraper();
    if (scraperResult.length > 0) {
      console.log(`[YouTube] ✅ HTML scraping found ${scraperResult.length} streams`);
      return scraperResult;
    }
    
    console.log("[YouTube] ⚠️ HTML scraping found no streams");
    
    // Step 2: API 엔드포인트 시도 (할당량 초과 체크 포함)
    console.log("[YouTube] 🔄 Step 2: Trying API endpoints...");
    
    // 할당량 초과 상태 확인 (24시간 후 재시도)
    if (youtubeQuotaExceeded) {
      const hoursSinceError = (Date.now() - youtubeQuotaExceededTime) / (1000 * 60 * 60);
      if (hoursSinceError < QUOTA_RESET_HOURS) {
        console.warn(`[YouTube] ⚠️ Quota exceeded. Skipping API call...`);
        console.warn(`[YouTube] ⚠️ API quota will reset in ${Math.round(QUOTA_RESET_HOURS - hoursSinceError)} hours`);
        return [];
      } else {
        // 24시간 경과 후 재시도
        console.log("[YouTube] ✅ Quota reset time passed. Retrying YouTube API calls...");
        youtubeQuotaExceeded = false;
        youtubeQuotaExceededTime = 0;
      }
    }

    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
    
    // Placeholder 값 체크
    const isPlaceholder = (value: string | undefined) => {
      if (!value) return true;
      const placeholderPatterns = [
        "your_youtube_api_key",
        "your_api_key",
      ];
      return placeholderPatterns.some(pattern => 
        value.toLowerCase().includes(pattern.toLowerCase())
      );
    };

    if (!YOUTUBE_API_KEY || isPlaceholder(YOUTUBE_API_KEY)) {
      console.warn("[YouTube] ⚠️ YOUTUBE_API_KEY is not set or is a placeholder value");
      console.warn("[YouTube] HTML scraping already attempted, returning empty array");
      return [];
    }
    
    // API 키 형식 확인 (Google API 키는 보통 39자)
    if (YOUTUBE_API_KEY.length < 20) {
      console.warn("[YouTube] ⚠️ API key seems too short (length:", YOUTUBE_API_KEY.length, ")");
      console.warn("[YouTube] Make sure you copied the full API key");
    }
    
    console.log("[YouTube] ✅ API key found (length:", YOUTUBE_API_KEY.length, ")");

    try {
    // 1단계: Search API로 후보군 추출
    // 카테고리별 검색어를 사용하여 더 넓은 범위의 방송을 가져온 후
    // 카테고리 룰 엔진으로 필터링
    const defaultCategory = getActiveCategoryRules().find(r => r.id === DEFAULT_CATEGORY_ID);
    
    // 더 많은 방송을 가져오기 위해 검색어 대폭 확장
    const searchQueries = [
      // 엑셀 방송 관련 검색어 (우선순위)
      ...(defaultCategory ? [
        { q: "엑셀 방송", regionCode: "KR", relevanceLanguage: "ko" },
        { q: "엑셀 라이브", regionCode: "KR", relevanceLanguage: "ko" },
        { q: "엑셀", regionCode: "KR", relevanceLanguage: "ko" },
        { q: "엑셀 강의", regionCode: "KR", relevanceLanguage: "ko" },
        { q: "엑셀 튜토리얼", regionCode: "KR", relevanceLanguage: "ko" },
      ] : []),
      // 일반 라이브 검색어 추가 (더 많은 방송 수집)
      { q: "라이브", regionCode: "KR", relevanceLanguage: "ko" },
      { q: "방송", regionCode: "KR", relevanceLanguage: "ko" },
      { q: "생방송", regionCode: "KR", relevanceLanguage: "ko" },
      { q: "실시간", regionCode: "KR", relevanceLanguage: "ko" },
      { q: "게임", regionCode: "KR", relevanceLanguage: "ko" },
      { q: "음악", regionCode: "KR", relevanceLanguage: "ko" },
      { q: "토크", regionCode: "KR", relevanceLanguage: "ko" },
    ];
    
    let allVideoItems: any[] = [];
    
    for (const searchConfig of searchQueries) {
      const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
      searchUrl.searchParams.set("part", "snippet");
      searchUrl.searchParams.set("eventType", "live");
      searchUrl.searchParams.set("type", "video");
      // 더 많은 결과를 가져오기 위해 maxResults 최대값 사용
      searchUrl.searchParams.set("maxResults", "50");
      searchUrl.searchParams.set("order", "viewCount");
      if (searchConfig.q) {
        searchUrl.searchParams.set("q", searchConfig.q);
      }
      if (searchConfig.regionCode) {
        searchUrl.searchParams.set("regionCode", searchConfig.regionCode);
      }
      if (searchConfig.relevanceLanguage) {
        searchUrl.searchParams.set("relevanceLanguage", searchConfig.relevanceLanguage);
      }
      searchUrl.searchParams.set("key", YOUTUBE_API_KEY);
      
      const queryDesc = searchConfig.q ? `"${searchConfig.q}"` : "(empty)";
      const regionDesc = searchConfig.regionCode ? ` (${searchConfig.regionCode})` : "";
      console.log(`[YouTube] Trying search with query: ${queryDesc}${regionDesc}`);
      
      try {
        const searchRes = await fetch(searchUrl.toString(), { 
          cache: "no-store",
          next: { revalidate: 0 },
          headers: {
            "Accept": "application/json",
          },
        });
        
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          const items = searchData.items || [];
          console.log(`[YouTube] Found ${items.length} videos with query ${queryDesc}${regionDesc}`);
          
          // 중복 제거 (videoId 기준)
          const existingIds = new Set(allVideoItems.map(item => item.id?.videoId));
          const newItems = items.filter((item: any) => 
            item.id?.videoId && !existingIds.has(item.id.videoId)
          );
          allVideoItems.push(...newItems);
          console.log(`[YouTube] Added ${newItems.length} new videos (total: ${allVideoItems.length})`);
          
          // 더 많은 결과를 수집하기 위해 중단 조건 완화 (최소 50개 이상)
          if (allVideoItems.length >= 50) {
            console.log(`[YouTube] ✅ Got enough results (${allVideoItems.length}), stopping search to save quota`);
            break;
          }
        } else {
          const errorText = await searchRes.text();
          let errorData: any = {};
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { message: errorText };
          }
          
          // 403 에러는 API 키 문제 또는 할당량 초과
          if (searchRes.status === 403) {
            const errorReason = errorData.error?.errors?.[0]?.reason || errorData.error?.message || "Unknown";
            const isQuotaExceeded = errorReason === "quotaExceeded" || errorReason.includes("quota");
            
            if (isQuotaExceeded) {
              // 할당량 초과 상태 저장
              youtubeQuotaExceeded = true;
              youtubeQuotaExceededTime = Date.now();
              
              console.error(`[YouTube] ❌ QUOTA EXCEEDED in search query "${queryDesc}${regionDesc}"`);
              console.error(`[YouTube] ⚠️ YouTube Data API v3 daily quota has been exceeded`);
              console.error(`[YouTube] ⚠️ YouTube API calls will be skipped for ${QUOTA_RESET_HOURS} hours`);
              console.error(`[YouTube] Solutions:`);
              console.error(`  1. Wait until quota resets (usually at midnight Pacific Time)`);
              console.error(`  2. Request quota increase in Google Cloud Console`);
              console.error(`  3. Use multiple API keys and rotate them`);
              console.error(`  4. Reduce API calls by implementing caching`);
              console.error(`[YouTube] Error details:`, JSON.stringify(errorData, null, 2));
            } else {
              console.error(`[YouTube] ❌ 403 Forbidden Error in search query "${queryDesc}${regionDesc}":`, errorReason);
              console.error(`[YouTube] Possible causes:`);
              console.error(`  1. API key is invalid or missing`);
              console.error(`  2. API quota exceeded (check Google Cloud Console)`);
              console.error(`  3. API key doesn't have YouTube Data API v3 enabled`);
              console.error(`  4. API key restrictions (IP, referrer, etc.)`);
              console.error(`[YouTube] Error details:`, JSON.stringify(errorData, null, 2));
            }
            
            // 첫 번째 검색 쿼리에서 403이 발생하면 전체 YouTube 호출 중단
            if (searchQueries.indexOf(searchConfig) === 0) {
              console.warn(`[YouTube] ⚠️ First search query failed with 403 - skipping all YouTube requests`);
              return []; // 빈 배열 반환
            }
          } else {
            console.warn(`[YouTube] Search with query ${queryDesc}${regionDesc} failed: ${searchRes.status}`, errorData);
          }
        }
      } catch (error) {
        console.warn(`[YouTube] Search with query ${queryDesc}${regionDesc} error:`, error);
      }
    }
    
    if (allVideoItems.length === 0) {
      console.warn("[YouTube] ⚠️ No videos found from any search query");
      return [];
    }
    
    console.log(`[YouTube] ✅ Total unique videos found: ${allVideoItems.length}`);
    
    // 기존 코드로 계속 진행 (allVideoItems 사용)
    const videoItems = allVideoItems;
    
    console.log(`[YouTube] ✅ Found ${videoItems.length} video candidates from search`);
    
    // 샘플 검색 결과 확인
    console.log(`[YouTube] Sample search results (first 3):`);
    videoItems.slice(0, 3).forEach((item: any, idx: number) => {
      console.log(`  ${idx + 1}. ${item.snippet?.title?.substring(0, 60)} - ${item.snippet?.channelTitle}`);
    });

    // 비디오 ID 목록 추출 (유효한 ID만)
    const allVideoIds = videoItems
      .map((item: any) => item.id?.videoId)
      .filter((id: string) => id);

    if (allVideoIds.length === 0) {
      console.warn("[YouTube] No valid video IDs found from search");
      return [];
    }

    console.log(`[YouTube] Step 2: Fetching details for ${allVideoIds.length} videos...`);

    // 2단계: Videos API로 상세 정보(시청자 수 등) 가져오기
    // YouTube API는 한 번에 최대 50개의 비디오 ID만 받을 수 있으므로 나눠서 호출
    const MAX_IDS_PER_REQUEST = 50;
    const allVideos: any[] = [];
    
    for (let i = 0; i < allVideoIds.length; i += MAX_IDS_PER_REQUEST) {
      const videoIdsBatch = allVideoIds.slice(i, i + MAX_IDS_PER_REQUEST);
      const videoIds = videoIdsBatch.join(",");
      
      console.log(`[YouTube] Fetching batch ${Math.floor(i / MAX_IDS_PER_REQUEST) + 1}/${Math.ceil(allVideoIds.length / MAX_IDS_PER_REQUEST)} (${videoIdsBatch.length} videos)...`);
      
      const videoUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
      videoUrl.searchParams.set("part", "snippet,liveStreamingDetails,statistics");
      videoUrl.searchParams.set("id", videoIds);
      videoUrl.searchParams.set("key", YOUTUBE_API_KEY);

      try {
        const videoRes = await fetch(videoUrl.toString(), { 
          cache: "no-store",
          next: { revalidate: 0 }
        });
        
        if (!videoRes.ok) {
          const errorText = await videoRes.text();
          let errorData: any = {};
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { message: errorText };
          }
          
          // 403 에러는 API 키 문제 또는 할당량 초과
          if (videoRes.status === 403) {
            const errorReason = errorData.error?.errors?.[0]?.reason || errorData.error?.message || "Unknown";
            const isQuotaExceeded = errorReason === "quotaExceeded" || errorReason.includes("quota");
            
            if (isQuotaExceeded) {
              // 할당량 초과 상태 저장
              youtubeQuotaExceeded = true;
              youtubeQuotaExceededTime = Date.now();
              
              console.error(`[YouTube] ❌ QUOTA EXCEEDED (batch ${Math.floor(i / MAX_IDS_PER_REQUEST) + 1})`);
              console.error(`[YouTube] ⚠️ YouTube Data API v3 daily quota has been exceeded`);
              console.error(`[YouTube] ⚠️ YouTube API calls will be skipped for ${QUOTA_RESET_HOURS} hours`);
              console.error(`[YouTube] Solutions:`);
              console.error(`  1. Wait until quota resets (usually at midnight Pacific Time)`);
              console.error(`  2. Request quota increase in Google Cloud Console`);
              console.error(`  3. Use multiple API keys and rotate them`);
              console.error(`  4. Reduce API calls by implementing caching`);
              console.error(`[YouTube] Error details:`, JSON.stringify(errorData, null, 2));
            } else {
              console.error(`[YouTube] ❌ 403 Forbidden Error (batch ${Math.floor(i / MAX_IDS_PER_REQUEST) + 1}):`, errorReason);
              console.error(`[YouTube] Possible causes:`);
              console.error(`  1. API key is invalid or missing`);
              console.error(`  2. API quota exceeded (check Google Cloud Console)`);
              console.error(`  3. API key doesn't have YouTube Data API v3 enabled`);
              console.error(`  4. API key restrictions (IP, referrer, etc.)`);
              console.error(`[YouTube] Error details:`, JSON.stringify(errorData, null, 2));
            }
            
            // 403 에러가 발생하면 YouTube 데이터는 건너뛰기
            // 첫 번째 배치에서 403이 발생하면 전체 YouTube 호출 중단
            if (i === 0) {
              console.warn(`[YouTube] ⚠️ First batch failed with 403 - skipping all YouTube requests`);
              break; // 전체 루프 중단
            }
          } else {
            console.error(`[YouTube] Failed to fetch video details (batch ${Math.floor(i / MAX_IDS_PER_REQUEST) + 1}):`, videoRes.status, errorData);
          }
          // 일부 배치가 실패해도 계속 진행 (403이 아닌 경우)
          continue;
        }

        const videoData = await videoRes.json();
        const batchVideos = videoData.items || [];
        allVideos.push(...batchVideos);
        console.log(`[YouTube] ✅ Fetched ${batchVideos.length} videos from batch ${Math.floor(i / MAX_IDS_PER_REQUEST) + 1}`);
      } catch (error) {
        console.error(`[YouTube] Error fetching batch ${Math.floor(i / MAX_IDS_PER_REQUEST) + 1}:`, error);
        // 일부 배치가 실패해도 계속 진행
        continue;
      }
    }
    
    const videos = allVideos;
    
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

    // 실제 라이브 방송만 필터링 (최대한 완화된 조건 - 데이터 손실 최소화)
    const liveVideos = videos.filter((video: any) => {
      // 1. liveBroadcastContent가 "live"인지 확인 (필수)
      const isLiveContent = video.snippet?.liveBroadcastContent === "live";
      if (!isLiveContent) {
        return false;
      }
      
      // 2. liveStreamingDetails가 있으면 더 정확한 필터링
      if (video.liveStreamingDetails) {
        // actualEndTime이 있으면 종료된 방송 (제외)
        if (video.liveStreamingDetails.actualEndTime) {
          return false;
        }
        
        // scheduledStartTime만 있고 actualStartTime이 없으면 예정된 방송 (제외)
        const hasScheduledOnly = video.liveStreamingDetails.scheduledStartTime && 
                                 !video.liveStreamingDetails.actualStartTime;
        if (hasScheduledOnly) {
          return false;
        }
      }
      
      // liveBroadcastContent가 "live"이면 라이브로 간주
      // liveStreamingDetails가 없어도 포함 (지연될 수 있음)
      return true;
    });

    console.log(`[YouTube] ✅ Filtered to ${liveVideos.length} live streams (from ${videos.length} total videos)`);
    
    if (liveVideos.length === 0 && videos.length > 0) {
      console.warn("[YouTube] ⚠️ All videos were filtered out!");
      console.warn("[YouTube] This suggests the filtering conditions might be too strict");
      console.warn("[YouTube] Filtering criteria:");
      console.warn("  - liveBroadcastContent must be 'live'");
      console.warn("  - actualEndTime must not exist");
      console.warn("  - If scheduledStartTime exists, actualStartTime must also exist");
      
      // 샘플 비디오의 liveBroadcastContent 확인
      const sampleVideo = videos[0];
      console.warn(`[YouTube] Sample video liveBroadcastContent: "${sampleVideo.snippet?.liveBroadcastContent}"`);
      console.warn(`[YouTube] Sample video has liveStreamingDetails: ${!!sampleVideo.liveStreamingDetails}`);
      if (sampleVideo.liveStreamingDetails) {
        console.warn(`[YouTube] Sample video actualEndTime: ${sampleVideo.liveStreamingDetails.actualEndTime || "none"}`);
        console.warn(`[YouTube] Sample video actualStartTime: ${sampleVideo.liveStreamingDetails.actualStartTime || "none"}`);
        console.warn(`[YouTube] Sample video scheduledStartTime: ${sampleVideo.liveStreamingDetails.scheduledStartTime || "none"}`);
      }
    }

    if (liveVideos.length === 0) {
      console.warn("[YouTube] ⚠️ No live streams after filtering. Checking all videos...");
      console.warn(`[YouTube] Total videos from API: ${videos.length}`);
      
      // 디버깅: 모든 비디오의 상세 정보 확인
      videos.forEach((video: any, index: number) => {
        const details = video.liveStreamingDetails || {};
        const isLiveContent = video.snippet?.liveBroadcastContent === "live";
        const hasDetails = !!video.liveStreamingDetails;
        const hasEndTime = !!details.actualEndTime;
        const hasStartTime = !!details.actualStartTime;
        const hasViewers = details.concurrentViewers !== undefined;
        
        console.log(`[YouTube] Video ${index + 1}/${videos.length}:`, {
          id: video.id,
          title: video.snippet?.title?.substring(0, 40),
          channel: video.snippet?.channelTitle?.substring(0, 30),
          liveBroadcastContent: video.snippet?.liveBroadcastContent,
          hasLiveDetails: hasDetails,
          hasEndTime,
          hasStartTime,
          hasViewers,
          concurrentViewers: details.concurrentViewers,
          reason: !isLiveContent ? "NOT_LIVE_CONTENT" : 
                  hasEndTime ? "ENDED" :
                  !hasDetails ? "NO_LIVE_DETAILS" :
                  "OTHER",
        });
      });
      
      // 필터링이 너무 엄격한 경우, liveBroadcastContent만 확인하여 일부라도 반환
      const fallbackVideos = videos.filter((video: any) => {
        const isLive = video.snippet?.liveBroadcastContent === "live";
        const hasEnded = video.liveStreamingDetails?.actualEndTime;
        return isLive && !hasEnded;
      });
      
      if (fallbackVideos.length > 0) {
        console.warn(`[YouTube] ⚠️ Using fallback filter: ${fallbackVideos.length} videos`);
        console.warn(`[YouTube] Original filter was too strict, using relaxed criteria`);
        
        // fallbackVideos를 사용하도록 변경
        const fallbackResult = fallbackVideos.map((video: any) => {
          let viewerCount: number | undefined = undefined;
          if (video.liveStreamingDetails?.concurrentViewers) {
            const viewers = video.liveStreamingDetails.concurrentViewers;
            viewerCount = typeof viewers === "string" ? parseInt(viewers, 10) : Number(viewers);
            if (isNaN(viewerCount)) viewerCount = undefined;
          }

          const thumbnailUrl = video.snippet?.thumbnails?.maxres?.url || 
                              video.snippet?.thumbnails?.high?.url || 
                              video.snippet?.thumbnails?.medium?.url ||
                              video.snippet?.thumbnails?.default?.url ||
                              "";

          return {
            bj: {
              id: `youtube-${video.snippet?.channelId || "unknown"}-${video.id}`,
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
            startedAt: video.liveStreamingDetails?.actualStartTime || 
                       video.liveStreamingDetails?.scheduledStartTime ||
                       video.snippet?.publishedAt ||
                       undefined,
          };
        });
        
        console.log(`[YouTube] ✅ Fallback result: ${fallbackResult.length} live streams`);
        return fallbackResult;
      }
      
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

    // Category-based filtering using rule engine
    // This allows the platform to support multiple categories,
    // not just a single hardcoded category
    const categoryRules = getActiveCategoryRules();
    
    const matchedVideos = liveVideos
      .map((video: any) => {
        const title = video.snippet?.title || "";
        const channelTitle = video.snippet?.channelTitle || "";
        const fullText = `${title} ${channelTitle}`;
        
        // 뉴스 채널 사전 필터링 (카테고리 매칭 전에 제외)
        const newsPattern = /(YTN|MBC.*뉴스|SBS.*뉴스|KBS.*뉴스|JTBC.*뉴스|채널A.*뉴스|TV조선.*뉴스|.*24.*시간.*뉴스|.*뉴스.*채널|.*뉴스.*24|.*뉴스.*방송|.*뉴스.*라이브)/i;
        if (newsPattern.test(fullText)) {
          return null; // 뉴스 채널 제외
        }
        
        // Match against all active category rules
        const detectedCategories = matchCategories(fullText, categoryRules);
        
        // 카테고리 매칭: 매칭 실패해도 포함 (정렬에서 우선순위 처리)
        const primaryCategoryId = detectedCategories.length > 0 
          ? getPrimaryCategory(detectedCategories) 
          : null;
        
        return {
          video,
          detectedCategories,
          primaryCategoryId: primaryCategoryId || null,
        };
      });
    
    // 카테고리 매칭된 비디오 필터링
    // 1순위: 엑셀 방송 매칭된 것
    // 2순위: 매칭 실패했지만 한국어 방송 (우선 표시)
    const defaultCategoryVideos = matchedVideos
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => {
        // 엑셀 방송 매칭된 것 우선
        const aIsExcel = a.primaryCategoryId === DEFAULT_CATEGORY_ID;
        const bIsExcel = b.primaryCategoryId === DEFAULT_CATEGORY_ID;
        if (aIsExcel && !bIsExcel) return -1;
        if (!aIsExcel && bIsExcel) return 1;
        
        // 한국어 방송 우선
        const koreanPattern = /[가-힣]/;
        const aIsKorean = koreanPattern.test(a.video.snippet?.title || "") || 
                         koreanPattern.test(a.video.snippet?.channelTitle || "");
        const bIsKorean = koreanPattern.test(b.video.snippet?.title || "") || 
                         koreanPattern.test(b.video.snippet?.channelTitle || "");
        if (aIsKorean && !bIsKorean) return -1;
        if (!aIsKorean && bIsKorean) return 1;
        
        return 0;
      })
      .slice(0, 50); // 최대 50개로 제한
    
    console.log(`[YouTube] ✅ Filtered to ${defaultCategoryVideos.length} category-matched live streams (from ${liveVideos.length} total live streams)`);
    console.log(`[YouTube] 📊 Total matches across all categories: ${matchedVideos.length}`);
    
    if (defaultCategoryVideos.length === 0 && liveVideos.length > 0) {
      console.warn("[YouTube] ⚠️ No streams matched default category");
      console.warn("[YouTube] Sample live stream titles (first 5):");
      liveVideos.slice(0, 5).forEach((video: any, idx: number) => {
        console.warn(`  ${idx + 1}. ${video.snippet?.title?.substring(0, 60)}`);
      });
    }
    
    // Map to LiveStreamInfo with category detection results
    const result = defaultCategoryVideos.map(({ video, detectedCategories, primaryCategoryId }) => {
      // 시청자 수 파싱 (문자열일 수 있음)
      let viewerCount: number | undefined = undefined;
      if (video.liveStreamingDetails?.concurrentViewers !== undefined) {
        const viewers = video.liveStreamingDetails.concurrentViewers;
        viewerCount = typeof viewers === "string" ? parseInt(viewers, 10) : Number(viewers);
        if (isNaN(viewerCount)) viewerCount = undefined;
      }

      // 썸네일 URL (최고 품질 우선)
      // 썸네일이 없으면 기본 이미지 사용
      const thumbnailUrl = video.snippet?.thumbnails?.maxres?.url || 
                          video.snippet?.thumbnails?.high?.url || 
                          video.snippet?.thumbnails?.medium?.url ||
                          video.snippet?.thumbnails?.default?.url ||
                          "/window.svg"; // 기본 이미지로 변경

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
        detectedCategories,
        primaryCategoryId: primaryCategoryId || undefined,
      };
    });

    // 정렬: 엑셀 방송 우선 → 한국어 방송 → 시청자 수
    const koreanPattern = /[가-힣]/;
    const sortedResult = result.sort((a, b) => {
      // 1순위: 엑셀 방송 매칭 여부
      const aIsExcel = a.primaryCategoryId === DEFAULT_CATEGORY_ID;
      const bIsExcel = b.primaryCategoryId === DEFAULT_CATEGORY_ID;
      if (aIsExcel && !bIsExcel) return -1;
      if (!aIsExcel && bIsExcel) return 1;
      
      // 2순위: 한국어 방송
      const aIsKorean = koreanPattern.test(a.title || "") || koreanPattern.test(a.bj.name || "");
      const bIsKorean = koreanPattern.test(b.title || "") || koreanPattern.test(b.bj.name || "");
      if (aIsKorean && !bIsKorean) return -1;
      if (!aIsKorean && bIsKorean) return 1;
      
      // 3순위: 시청자 수
      return (b.viewerCount || 0) - (a.viewerCount || 0);
    });
    
    const koreanCount = sortedResult.filter(item => 
      koreanPattern.test(item.title || "") || koreanPattern.test(item.bj.name || "")
    ).length;
    
    console.log(`[YouTube] ✅ Successfully mapped ${sortedResult.length} category-matched live streams (${koreanCount} Korean)`);
    if (sortedResult.length > 0) {
      console.log(`[YouTube] Sample result (first 5):`);
      sortedResult.slice(0, 5).forEach((item, idx) => {
        const isKorean = koreanPattern.test(item.title || "") || koreanPattern.test(item.bj.name || "");
        const categoryTag = item.primaryCategoryId ? `[${item.primaryCategoryId}]` : "[unknown]";
        const tags = [categoryTag];
        if (isKorean) tags.push("[한국어]");
        console.log(`  ${idx + 1}. ${item.bj.name} - ${item.title?.substring(0, 40)} (${item.viewerCount || 0} viewers) ${tags.join(" ")}`);
      });
    } else {
      console.warn("[YouTube] ⚠️ No category-matched live streams in final result");
    }

    return sortedResult;
    } catch (error) {
      console.error("[YouTube] ❌ Failed to fetch YouTube live streams:", error);
      if (error instanceof Error) {
        console.error("[YouTube] Error message:", error.message);
        console.error("[YouTube] Error stack:", error.stack);
      }
      
      // No mock data fallback - return empty array on error
      console.error("[YouTube] ❌ Error occurred - check error details above");
      return [];
    }
  } catch (error) {
    console.error("[YouTube] ❌ Failed to fetch YouTube live streams (outer catch):", error);
    if (error instanceof Error) {
      console.error("[YouTube] Error message:", error.message);
      console.error("[YouTube] Error stack:", error.stack);
    }
    
    // No mock data fallback - return empty array on error
    console.error("[YouTube] ❌ Error occurred - check error details above");
    return [];
  }
}

/**
 * 특정 플랫폼의 라이브 방송만 가져옵니다.
 */
export async function getLiveListByPlatform(platform: "youtube") {
  const result = await getCurrentLiveList();
  if (!result.success) {
    return result;
  }

  const filtered = result.liveList.filter((item) => item.bj.platform === platform);
  return { success: true, liveList: filtered };
}
