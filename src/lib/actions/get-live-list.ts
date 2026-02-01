"use server";

import { getSupabaseServerClient } from "../supabase-server";
import { getYouTubeLiveStatus } from "../youtube-api";
import { scrapeYouTubeLiveSearch } from "../youtube-scraper";
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
    console.log("[YouTube] 🔄 Using HTML scraping method (no API required)");
    
    // HTML 크롤링 방식으로 라이브 방송 가져오기
    const defaultCategory = getActiveCategoryRules().find(r => r.id === DEFAULT_CATEGORY_ID);
    
    // 검색어 목록
    const searchQueries = [
      "라이브",
      "생방송",
      ...(defaultCategory ? [
        "엑셀 방송",
        "엑셀 라이브",
      ] : []),
    ];
    
    const allScrapedVideos: any[] = [];
    const seenVideoIds = new Set<string>();
    
    // 병렬 스크래핑으로 성능 개선
    console.log(`[YouTube] 🚀 Starting parallel scraping for ${searchQueries.length} queries...`);
    const startTime = Date.now();
    
    const scrapePromises = searchQueries.map(async (query) => {
      try {
        console.log(`[YouTube] 🔍 Scraping live streams for: "${query}"`);
        const scraped = await scrapeYouTubeLiveSearch(query);
        return { query, scraped, success: true };
      } catch (error) {
        console.warn(`[YouTube] ⚠️ Failed to scrape "${query}":`, error);
        return { query, scraped: [], success: false };
      }
    });
    
    // 모든 스크래핑 작업을 병렬로 실행
    const results = await Promise.all(scrapePromises);
    
    // 결과 병합 및 중복 제거
    for (const { scraped } of results) {
      for (const video of scraped) {
        if (!seenVideoIds.has(video.videoId)) {
          seenVideoIds.add(video.videoId);
          allScrapedVideos.push(video);
        }
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`[YouTube] ✅ Parallel scraping completed in ${duration}ms`);
    console.log(`[YouTube] 📊 Total unique streams: ${allScrapedVideos.length}`);
    
    if (allScrapedVideos.length === 0) {
      console.warn("[YouTube] ⚠️ No live streams found from scraping");
      return [];
    }
    
    console.log(`[YouTube] ✅ Total unique live streams found: ${allScrapedVideos.length}`);
    
    // Category-based filtering
    const categoryRules = getActiveCategoryRules();
    
    const matchedVideos = allScrapedVideos
      .map((scraped) => {
        const title = scraped.title || "";
        const channelTitle = scraped.channelTitle || "";
        const fullText = `${title} ${channelTitle}`;
        
        // 뉴스 채널 사전 필터링
        const newsPattern = /(YTN|MBC.*뉴스|SBS.*뉴스|KBS.*뉴스|JTBC.*뉴스|채널A.*뉴스|TV조선.*뉴스|.*24.*시간.*뉴스|.*뉴스.*채널|.*뉴스.*24|.*뉴스.*방송|.*뉴스.*라이브)/i;
        if (newsPattern.test(fullText)) {
          return null;
        }
        
        // 카테고리 매칭
        const detectedCategories = matchCategories(fullText, categoryRules);
        const primaryCategoryId = detectedCategories.length > 0 
          ? getPrimaryCategory(detectedCategories) 
          : null;
        
        return {
          scraped,
          detectedCategories,
          primaryCategoryId: primaryCategoryId || null,
        };
      });
    
    // 정렬 및 필터링
    const sortedVideos = matchedVideos
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => {
        // 엑셀 방송 우선
        const aIsExcel = a.primaryCategoryId === DEFAULT_CATEGORY_ID;
        const bIsExcel = b.primaryCategoryId === DEFAULT_CATEGORY_ID;
        if (aIsExcel && !bIsExcel) return -1;
        if (!aIsExcel && bIsExcel) return 1;
        
        // 시청자 수로 정렬
        return (b.scraped.viewerCount || 0) - (a.scraped.viewerCount || 0);
      })
      .slice(0, 100);
    
    console.log(`[YouTube] ✅ Filtered to ${sortedVideos.length} live streams`);
    
    // LiveStreamInfo로 변환
    const result: LiveStreamInfo[] = sortedVideos.map(({ scraped, detectedCategories, primaryCategoryId }) => {
      const channelId = scraped.channelId || `unknown-${scraped.videoId}`;
      
      return {
        bj: {
          id: `youtube-${channelId}-${scraped.videoId}`,
          name: scraped.channelTitle || "Unknown Channel",
          platform: "youtube" as const,
          isLive: true,
          currentScore: 0,
          thumbnailUrl: scraped.thumbnailUrl || "/window.svg",
          channelUrl: channelId.startsWith("UC") 
            ? `https://www.youtube.com/channel/${channelId}`
            : `https://www.youtube.com/watch?v=${scraped.videoId}`,
          streamUrl: `https://www.youtube.com/watch?v=${scraped.videoId}`,
        },
        isLive: true,
        title: scraped.title || "Untitled Live Stream",
        thumbnailUrl: scraped.thumbnailUrl || undefined,
        viewerCount: scraped.viewerCount,
        streamUrl: `https://www.youtube.com/watch?v=${scraped.videoId}`,
        startedAt: scraped.publishedAt,
        detectedCategories,
        primaryCategoryId: primaryCategoryId || undefined,
      };
    });
    
    // 최종 정렬: 엑셀 방송 우선 → 한국어 방송 → 시청자 수
    const koreanPattern = /[가-힣]/;
    const finalResult = result.sort((a, b) => {
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
    
    console.log(`[YouTube] ✅ Successfully mapped ${finalResult.length} live streams`);
    if (finalResult.length > 0) {
      console.log(`[YouTube] Sample result (first 5):`);
      finalResult.slice(0, 5).forEach((item, idx) => {
        console.log(`  ${idx + 1}. ${item.bj.name} - ${item.title?.substring(0, 40)} (${item.viewerCount || 0} viewers)`);
      });
    }
    
    return finalResult;
  } catch (error) {
    console.error("[YouTube] ❌ Failed to fetch YouTube live streams:", error);
    if (error instanceof Error) {
      console.error("[YouTube] Error message:", error.message);
      console.error("[YouTube] Error stack:", error.stack);
    }
    
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
