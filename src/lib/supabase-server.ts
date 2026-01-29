import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.warn("SUPABASE_URL is not set. Server-side admin actions will fail.");
}

if (!serviceRoleKey) {
  console.warn(
    "SUPABASE_SERVICE_ROLE_KEY is not set. Never expose this as NEXT_PUBLIC_*. It must stay on the server only."
  );
}

export function getSupabaseServerClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    // Supabase가 설정되지 않은 경우 null 반환 (Frontend 기반 모드)
    console.warn("Supabase not configured. Running in frontend-only mode.");
    return null as any;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

