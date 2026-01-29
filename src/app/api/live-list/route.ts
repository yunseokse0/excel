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
  try {
    const { searchParams } = new URL(req.url);
    const platform = searchParams.get("platform") as "youtube" | "soop" | null;

    console.log(`[API] Getting live list for platform: ${platform || "all"}`);

    const result = platform
      ? await getLiveListByPlatform(platform)
      : await getCurrentLiveList();

    console.log(`[API] Result: success=${result.success}, count=${result.liveList?.length || 0}`);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          liveList: [],
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: result.liveList.length,
      liveList: result.liveList,
    });
  } catch (error) {
    console.error("[API] Failed to get live list:", error);
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
