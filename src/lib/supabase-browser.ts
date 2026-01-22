import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function getSupabaseBrowserClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    // 환경 변수가 없으면 Supabase 기능을 비활성화하고, 상위에서 mock 데이터로 fallback 하도록 합니다.
    throw new Error("Supabase env not configured");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

