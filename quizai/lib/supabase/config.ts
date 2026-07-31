// Supabase connection values. The URL and the *publishable/anon* key are
// public by design (they ship in the client bundle and are protected by RLS),
// so we hardcode them as fallbacks. This keeps the app working even when the
// NEXT_PUBLIC_* env vars aren't injected at build time on a given host.
// Env vars still take precedence if set.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://czgzfqjfjfxrwlxostnj.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_p2lsbeZvy2r74kK6bx86Cw_NRUxeqsD";
