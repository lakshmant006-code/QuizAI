import { NextResponse, type NextRequest } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/safeNext";

// Handles the magic-link / password-reset / signup redirect. Exchanges the
// code (or token_hash) for a session, then sends the user to `next`
// (default: the dashboard).
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(searchParams.get("next"));
  // OAuth providers (e.g. Google) redirect back with an error when the user
  // cancels or consent fails — surface it instead of a generic message.
  const oauthError = searchParams.get("error_description") || searchParams.get("error");

  // Build the PUBLIC origin. Behind Render/Vercel the Node server sees an
  // internal origin (e.g. http://localhost:10000), so trust the forwarded host.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  const publicOrigin = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;

  if (oauthError) {
    return NextResponse.redirect(
      `${publicOrigin}/login?error=${encodeURIComponent(oauthError)}`,
    );
  }

  const supabase = await createClient();
  let ok = false;
  let reason = "missing_params";
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
    if (error) reason = error.message;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    ok = !error;
    if (error) reason = error.message;
  }

  if (ok) {
    return NextResponse.redirect(`${publicOrigin}${next}`);
  }
  return NextResponse.redirect(
    `${publicOrigin}/login?error=${encodeURIComponent(reason)}`,
  );
}
