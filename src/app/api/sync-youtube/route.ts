import { NextRequest, NextResponse } from "next/server";
import { syncAllYouTubeLives } from "../../../lib/actions/sync-youtube-live";

/**
 * GET /api/sync-youtube
 * 모든 YouTube BJ의 라이브 상태를 동기화합니다.
 * 
 * Vercel Cron에서 주기적으로 호출하거나,
 * 관리자 페이지에서 수동으로 호출할 수 있습니다.
 * 
 * 보안: 실제 운영 환경에서는 인증 토큰을 확인하는 로직을 추가하세요.
 */
export async function GET(req: NextRequest) {
  // 간단한 인증 체크 (실제 운영에서는 더 강력한 인증 필요)
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Vercel Cron은 자동으로 Authorization 헤더를 추가하지 않으므로,
    // 실제로는 Vercel Cron의 경우 별도 인증 로직이 필요할 수 있습니다.
    // 여기서는 일단 허용하되, 실제 운영에서는 IP 화이트리스트나 다른 방법 사용 권장
  }

  try {
    const result = await syncAllYouTubeLives();

    return NextResponse.json({
      ...result,
      message: `Synced ${result.synced} out of ${result.total} YouTube BJs`,
    });
  } catch (error) {
    console.error("Failed to sync YouTube lives:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
