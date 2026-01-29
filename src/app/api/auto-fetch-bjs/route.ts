import { NextRequest, NextResponse } from "next/server";
import {
  autoFetchPopularYouTubeChannels,
  autoFetchPopularSoopBJs,
} from "../../../lib/actions/auto-fetch-bjs";

/**
 * GET /api/auto-fetch-bjs
 * YouTube와 SOOP에서 인기 라이브 방송 중인 BJ를 자동으로 가져옵니다.
 * 
 * Query parameters:
 * - platform: "youtube" | "soop" | "all" (기본값: "all")
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const platform = searchParams.get("platform") || "all";

    if (platform === "youtube" || platform === "all") {
      const result = await autoFetchPopularYouTubeChannels();
      if (!result.success) {
        return NextResponse.json(result, { status: 500 });
      }
      return NextResponse.json(result);
    }

    if (platform === "soop" || platform === "all") {
      const result = await autoFetchPopularSoopBJs();
      if (!result.success) {
        return NextResponse.json(result, { status: 500 });
      }
      return NextResponse.json(result);
    }

    return NextResponse.json(
      {
        success: false,
        error: "Invalid platform parameter",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Failed to auto-fetch BJs:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
