import { NextRequest, NextResponse } from "next/server";
import { getLiveRankingByViewers } from "../../../lib/actions/get-live-ranking";

// 실시간 데이터이므로 캐시 비활성화
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/live-ranking
 * 실시간 시청자수 기반 랭킹을 가져옵니다.
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log(`[API] 📡 Getting live ranking...`);

    const result = await getLiveRankingByViewers();

    const duration = Date.now() - startTime;
    console.log(`[API] ✅ Ranking result: success=${result.success}, count=${result.ranking?.length || 0}, duration=${duration}ms`);

    if (!result.success) {
      const errorMessage = result.error || "Failed to fetch live ranking";
      console.error(`[API] ❌ Failed: ${errorMessage}`);
      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          ranking: [],
        },
        { status: 500 }
      );
    }

    if (result.ranking.length === 0) {
      console.warn(`[API] ⚠️ No ranking entries found`);
    }

    return NextResponse.json({
      success: true,
      count: result.ranking.length,
      ranking: result.ranking,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[API] ❌ Failed to get live ranking (duration: ${duration}ms):`, error);
    
    if (error instanceof Error) {
      console.error("[API] Error message:", error.message);
      console.error("[API] Error stack:", error.stack);
    }
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        ranking: [],
      },
      { status: 500 }
    );
  }
}
