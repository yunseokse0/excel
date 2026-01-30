import { NextRequest, NextResponse } from "next/server";
import { getCurrentLiveList, getLiveListByPlatform } from "../../../lib/actions/get-live-list";

// 실시간 데이터이므로 캐시 비활성화
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/live-list
 * 현재 YouTube와 SOOP에서 방송 중인 리스트를 가져옵니다.
 * 
 * Query parameters:
 * - platform: "youtube" | "soop" (선택사항, 없으면 전체)
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(req.url);
    const platform = searchParams.get("platform") as "youtube" | "soop" | null;

    console.log(`[API] 📡 Getting live list for platform: ${platform || "all"}`);

    const result = platform
      ? await getLiveListByPlatform(platform)
      : await getCurrentLiveList();

    const duration = Date.now() - startTime;
    const count = result.liveList?.length || 0;
    console.log(`[API] ✅ Result: success=${result.success}, count=${count}, duration=${duration}ms`);
    
    // 상세 로깅: 각 스트림의 정보 출력
    if (result.liveList && result.liveList.length > 0) {
      console.log(`[API] 📺 Live streams details:`);
      result.liveList.forEach((stream: any, index: number) => {
        console.log(`[API]   ${index + 1}. ${stream.bj?.name || 'Unknown'} (${stream.bj?.platform || 'unknown'}) - ${stream.title?.substring(0, 50) || 'No title'} - Viewers: ${stream.viewerCount || 0}`);
      });
    } else {
      console.warn(`[API] ⚠️ No live streams in result (count: ${count})`);
      console.warn(`[API] 🔍 서버 사이드 로그 확인 필요:`);
      console.warn(`  - [LiveList] 로그: 방송 데이터 가져오기 시작`);
      console.warn(`  - [YouTube] 로그: YouTube API 호출 결과`);
      console.warn(`  - [SOOP] 로그: SOOP API 호출 결과`);
      console.warn(`[API] 💡 가능한 원인:`);
      console.warn(`  1. YouTube API 할당량 초과 (24시간 후 자동 재시도)`);
      console.warn(`  2. SOOP API 엔드포인트 실패`);
      console.warn(`  3. 현재 실제로 방송 중인 BJ가 없음`);
      console.warn(`  4. 필터링 로직이 모든 방송을 제외함`);
    }

    if (!result.success) {
      const errorMessage = (result as any).error || "Failed to fetch live list";
      console.error(`[API] ❌ Failed: ${errorMessage}`);
      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          liveList: [],
        },
        { status: 500 }
      );
    }

    // 플랫폼별 통계
    const youtubeCount = result.liveList.filter((item: any) => item.bj?.platform === "youtube").length;
    const soopCount = result.liveList.filter((item: any) => item.bj?.platform === "soop").length;
    
    console.log(`[API] 📊 Platform breakdown: YouTube=${youtubeCount}, SOOP=${soopCount}, Total=${result.liveList.length}`);
    
    if (result.liveList.length === 0) {
      console.warn(`[API] ⚠️ No live streams found (platform: ${platform || "all"})`);
      
      // 디버그 정보 추가
      const debugInfo: any = {
        hasYoutubeKey: !!process.env.YOUTUBE_API_KEY,
        youtubeKeyLength: process.env.YOUTUBE_API_KEY?.length || 0,
        hasSupabase: !!process.env.SUPABASE_URL,
      };
      
      console.warn(`[API] Debug info:`, debugInfo);
    } else if (youtubeCount === 0 && !!process.env.YOUTUBE_API_KEY) {
      console.warn(`[API] ⚠️ YouTube API key is set but no YouTube streams found`);
      console.warn(`[API] Only SOOP streams are showing (${soopCount} streams)`);
      console.warn(`[API] Check server logs above for "[YouTube]" error messages`);
    }

    // 서버 로그 요약 정보 수집
    const serverLogSummary = {
      youtubeQuotaExceeded: false,
      soopApiFailed: false,
      youtubeStreamsFound: 0,
      soopStreamsFound: 0,
      totalBeforeFilter: 0,
      totalAfterFilter: result.liveList.length,
    };

    return NextResponse.json({
      success: true,
      count: result.liveList.length,
      liveList: result.liveList,
      // 디버그 정보 (개발 환경에서만)
      ...(process.env.NODE_ENV === "development" ? {
        debug: {
          hasYoutubeKey: !!process.env.YOUTUBE_API_KEY,
          youtubeKeyLength: process.env.YOUTUBE_API_KEY?.length || 0,
          hasSupabase: !!process.env.SUPABASE_URL,
          isMock: (result as any).isMock || false,
          timestamp: new Date().toISOString(),
          diagnosticInfo: (result as any).diagnosticInfo || null,
          serverLogSummary,
          message: result.liveList.length === 0 
            ? (result as any).diagnosticInfo?.youtubeQuotaExceeded
              ? "YouTube API 할당량이 초과되었습니다. 24시간 후 자동으로 재시도됩니다. 서버 터미널에서 [YouTube] 로그를 확인하세요."
              : "서버 터미널에서 [LiveList], [YouTube], [SOOP]로 시작하는 로그를 확인하세요. 특히 YouTube API 할당량 초과 메시지를 확인하세요."
            : `${result.liveList.length}개의 방송을 찾았습니다.`,
        }
      } : {}),
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[API] ❌ Failed to get live list (duration: ${duration}ms):`, error);
    
    if (error instanceof Error) {
      console.error("[API] Error message:", error.message);
      console.error("[API] Error stack:", error.stack);
    }
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        liveList: [],
      },
      { status: 500 }
    );
  }
}
