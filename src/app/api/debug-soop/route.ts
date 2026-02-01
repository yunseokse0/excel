import { NextResponse } from "next/server";
import { getCurrentLiveList } from "@/lib/actions/get-live-list";

/**
 * GET /api/debug-soop
 * SOOP 방송 수집 디버깅을 위한 상세 정보를 반환합니다.
 */
export async function GET() {
  try {
    console.log("[Debug SOOP] Starting debug...");
    
    // SOOP만 가져오기
    const result = await getCurrentLiveList();
    
    const soopStreams = result.liveList?.filter((stream: any) => stream.bj?.platform === "soop") || [];
    
    return NextResponse.json({
      success: true,
      totalStreams: result.liveList?.length || 0,
      soopStreams: soopStreams.length,
      soopDetails: soopStreams.map((stream: any) => ({
        bjName: stream.bj?.name,
        title: stream.title,
        viewerCount: stream.viewerCount,
        streamUrl: stream.streamUrl,
        thumbnailUrl: stream.thumbnailUrl,
      })),
      allStreams: result.liveList?.map((stream: any) => ({
        platform: stream.bj?.platform,
        name: stream.bj?.name,
        title: stream.title?.substring(0, 50),
      })) || [],
      debug: {
        hasSupabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasYoutubeKey: !!process.env.YOUTUBE_API_KEY,
      },
    });
  } catch (error) {
    console.error("[Debug SOOP] Error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
