import { NextRequest, NextResponse } from "next/server";
import { calculateScoresFromViewers } from "../../../lib/actions/calculate-scores";

/**
 * GET /api/calculate-scores
 * 시청자 수 기반 자동 점수 계산 및 랭킹 업데이트
 */
export async function GET(req: NextRequest) {
  try {
    const result = await calculateScoresFromViewers();

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Scores calculated successfully",
    });
  } catch (error) {
    console.error("Failed to calculate scores:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
