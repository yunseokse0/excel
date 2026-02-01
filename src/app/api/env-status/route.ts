import { NextResponse } from "next/server";

/**
 * GET /api/env-status
 * 환경 변수 설정 상태를 확인합니다.
 * 개발 환경에서만 상세 정보를 반환합니다.
 */
export async function GET() {
  const isDevelopment = process.env.NODE_ENV === "development";

  const status = {
    hasYoutubeKey: !!process.env.YOUTUBE_API_KEY,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    ...(isDevelopment ? {
      youtubeKeyLength: process.env.YOUTUBE_API_KEY?.length || 0,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "미설정",
      supabaseUrlValid: process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("https://") && 
                       process.env.NEXT_PUBLIC_SUPABASE_URL?.includes(".supabase.co"),
    } : {}),
  };

  return NextResponse.json({
    success: true,
    status,
    message: isDevelopment 
      ? "개발 환경: 상세 정보 표시"
      : "프로덕션 환경: 기본 정보만 표시",
  });
}
