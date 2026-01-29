import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function getSupabaseBrowserClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Frontend 기반 모드: null 반환 (호출하는 쪽에서 mock 데이터로 처리)
    return null as any;
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

