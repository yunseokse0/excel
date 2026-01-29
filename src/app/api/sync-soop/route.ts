import { NextRequest, NextResponse } from "next/server";
import { syncAllSoopLives } from "../../../lib/actions/sync-soop-live";

/**
 * GET /api/sync-soop
 * 모든 SOOP BJ의 라이브 상태를 동기화합니다.
 */
export async function GET(req: NextRequest) {
  try {
    const result = await syncAllSoopLives();

    return NextResponse.json({
      success: result.success,
      message: `Synced ${result.synced} out of ${result.total} SOOP BJs`,
      ...result,
    });
  } catch (error) {
    console.error("Failed to sync SOOP lives:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
