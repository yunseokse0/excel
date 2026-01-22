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
    throw new Error("Supabase service role env not configured");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

