import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 환경 변수 검증 유틸리티
 * Vercel 배포 시 환경 변수가 제대로 설정되었는지 확인합니다.
 */
export function validateEnvVars() {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Supabase 환경 변수 (선택사항)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    warnings.push(
      "Supabase 환경 변수가 설정되지 않았습니다. Mock 데이터를 사용합니다."
    );
  } else {
    // Supabase URL 형식 검증
    if (!supabaseUrl.startsWith("https://") || !supabaseUrl.includes(".supabase.co")) {
      errors.push("NEXT_PUBLIC_SUPABASE_URL 형식이 올바르지 않습니다.");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    hasSupabase: !!supabaseUrl && !!supabaseAnonKey,
  };
}

/**
 * 클라이언트 사이드에서 환경 변수 상태를 확인합니다.
 * 개발 환경에서만 상세 정보를 반환합니다.
 */
export function getEnvStatus() {
  if (typeof window === "undefined") {
    return null; // 서버 사이드에서는 null 반환
  }

  const validation = validateEnvVars();
  
  return {
    hasSupabase: validation.hasSupabase,
    ...(process.env.NODE_ENV === "development" ? {
      errors: validation.errors,
      warnings: validation.warnings,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? "설정됨" : "미설정",
    } : {}),
  };
}