import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabasePublishableKey &&
    supabaseUrl.startsWith("http")
);

// Fallback dummy client if credentials aren't provided in development
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabasePublishableKey!)
  : createClient("https://placeholder.supabase.co", "placeholder-key");
