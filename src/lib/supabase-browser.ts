import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * 브라우저에서 Supabase 클라이언트를 생성합니다.
 * 환경 변수가 설정되지 않은 경우 null을 반환합니다 (mock 데이터 모드).
 * 
 * Vercel 배포 시:
 * - NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를
 *   Vercel 대시보드의 환경 변수에 설정해야 합니다.
 */
export function getSupabaseBrowserClient() {
  // Placeholder 값 무시 (설정되지 않은 것으로 처리)
  const isPlaceholder = (value: string | undefined) => {
    if (!value) return true;
    const placeholderPatterns = [
      "your_supabase_url",
      "your_supabase_anon_key",
      "your_anon_key",
      "your_service_role_key",
    ];
    return placeholderPatterns.some(pattern => 
      value.toLowerCase().includes(pattern.toLowerCase())
    );
  };

  if (!supabaseUrl || !supabaseAnonKey || isPlaceholder(supabaseUrl) || isPlaceholder(supabaseAnonKey)) {
    // Frontend 기반 모드: null 반환 (호출하는 쪽에서 mock 데이터로 처리)
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[Supabase] 환경 변수가 설정되지 않았습니다. Mock 데이터를 사용합니다.\n" +
        "Vercel 배포 시 NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 설정하세요."
      );
    }
    return null as any;
  }

  // URL 형식 검증
  if (!supabaseUrl.startsWith("https://") || !supabaseUrl.includes(".supabase.co")) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[Supabase] NEXT_PUBLIC_SUPABASE_URL 형식이 올바르지 않습니다:",
        supabaseUrl
      );
    }
    return null as any;
  }

  try {
    return createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error("[Supabase] 클라이언트 생성 실패:", error);
    return null as any;
  }
}

