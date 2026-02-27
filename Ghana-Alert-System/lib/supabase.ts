import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://mcvdzewqydblspcnmkrs.supabase.co";

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL) {
  throw new Error("EXPO_PUBLIC_SUPABASE_URL is not set");
}

if (!SUPABASE_ANON_KEY) {
  throw new Error("EXPO_PUBLIC_SUPABASE_ANON_KEY is not set");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

