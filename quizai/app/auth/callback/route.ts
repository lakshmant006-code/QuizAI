import { NextResponse, type NextRequest } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Handles the magic-link redirect. Exchanges the code (or token_hash) for a
// session, then sends the user to `next` (default: the dashboard). Uses
// x-forwarded-host so the redirect targets the public domain behind Vercel's
// proxy instead of the internal origin.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") || "/dashboard";

  const supabase = await createClient();
  let ok = false;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    ok = !error;
  }

  if (ok) {
    const forwardedHost = request.headers.get("x-forwarded-host");
    const isLocal = process.env.NODE_ENV === "development";
    const base = isLocal ? origin : forwardedHost ? `https://${forwardedHost}` : origin;
    return NextResponse.redirect(`${base}${next}`);
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
