/**
 * Sanitize a user-supplied `next` redirect target.
 *
 * The `next` query param comes straight from the URL, so an attacker can craft
 * `/login?next=https://evil.com` and bounce a freshly-authenticated user off-site.
 * Only allow internal, absolute paths: a single leading "/", and never a
 * protocol-relative ("//host") or backslash-smuggled ("/\host") path.
 */
export function safeNextPath(
  raw: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (!raw || !raw.startsWith("/")) return fallback;
  if (raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  return raw;
}
