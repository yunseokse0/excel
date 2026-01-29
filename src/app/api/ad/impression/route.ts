import { NextRequest, NextResponse } from "next/server";
import { incrementAdImpression } from "../../../../lib/actions/ad-stats";
import { getOrCreateSession, getUserGroup } from "../../../../lib/actions/user-session";

export async function POST(req: NextRequest) {
  try {
    const { adId, pagePath } = await req.json();

    if (!adId) {
      return NextResponse.json(
        { success: false, error: "adId is required" },
        { status: 400 }
      );
    }

    const sessionId = await getOrCreateSession();
    const userGroup = await getUserGroup();

    await incrementAdImpression(adId, pagePath, sessionId, userGroup);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to increment ad impression:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
