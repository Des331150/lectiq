/**
 * User-facing wording for authentication failures.
 *
 * The auth pages previously rendered `error.message` straight from Supabase,
 * which leaked internal wording ("User already registered", "Password should be
 * at least 6 characters.") to anyone on the page.
 *
 * Two concerns are handled separately here:
 *
 * 1. Plain-language copy for the failures a person can act on.
 * 2. Account enumeration. Supabase returns `user_already_exists` on signup,
 *    which tells an anonymous visitor whether an address has an account. That
 *    message is deliberately not surfaced verbatim - `ACCOUNT_EXISTS` reads as
 *    though nothing happened, and the signup screen pairs it with a route to
 *    sign in. Reporting the address regardless would leak the fact that the
 *    account exists, which is the more serious of the two problems.
 */

/** Shown instead of confirming that an email is registered. */
export const ACCOUNT_EXISTS_NOTICE =
  "If that email can be used to sign up, we'll send a confirmation link to it.";

const MESSAGES: Record<string, string> = {
  invalid_credentials: "That email and password don't match an account.",
  user_already_exists: ACCOUNT_EXISTS_NOTICE,
  email_not_confirmed: "Check your inbox for the confirmation link we sent you.",
  weak_password: "Choose a longer password — at least 6 characters.",
  over_request_rate_limit:
    "Too many attempts. Wait a minute, then try again.",
  over_email_send_rate_limit:
    "Too many emails requested. Wait a minute, then try again.",
};

/**
 * Translate a Supabase auth error into something a person can act on.
 *
 * Unrecognised errors fall back to a generic message rather than passing the
 * provider's wording through, since new error codes would otherwise surface
 * untranslated.
 */
export function authErrorMessage(
  error: { message?: string; code?: string; status?: number } | null
): string {
  if (!error) return "Something went wrong. Please try again.";

  // The SDK puts a stable machine code on `code` and a human string on
  // `message`. The code is the reliable key: a failed sign-in reports
  // "Invalid login credentials" as its message, so matching on message text
  // alone misses it and falls through to the generic copy.
  if (error.code && MESSAGES[error.code]) return MESSAGES[error.code];

  const raw = error.message ?? "";
  const prefix = raw.match(/^(?:Auth|Api)\w*Error:\s*/i);
  const body = (prefix ? raw.slice(prefix[0].length) : raw).toLowerCase();

  for (const [code, message] of Object.entries(MESSAGES)) {
    if (body.includes(code.toLowerCase().replace(/_/g, " "))) return message;
    if (body.includes(code.toLowerCase())) return message;
  }

  // Fallbacks for codes we do not map: match on the wording the provider uses.
  if (/invalid login credentials|invalid credentials/.test(body)) {
    return MESSAGES.invalid_credentials;
  }
  if (/already registered|already been registered/.test(body)) {
    return ACCOUNT_EXISTS_NOTICE;
  }
  if (/at least \d+ characters/.test(body)) {
    return MESSAGES.weak_password;
  }
  if (/rate limit|too many/.test(body)) {
    return MESSAGES.over_request_rate_limit;
  }

  return "Something went wrong. Please try again.";
}

/** True when the failure means the email is already registered. */
export function isAccountExists(
  error: { message?: string; code?: string } | null
): boolean {
  if (!error) return false;
  if (error.code === "user_already_exists") return true;
  return /already registered/i.test(error.message ?? "");
}

/**
 * Copy for the `?error=` codes the auth callback routes emit.
 *
 * app/auth/callback redirects to `auth_failed` when a confirmation link cannot
 * be exchanged, and app/auth/confirm to `verification_failed`. Neither page
 * read those params, so an expired or already-used link landed on a bare form
 * with no explanation.
 */
const CALLBACK_MESSAGES: Record<string, string> = {
  auth_failed:
    "That sign-in link is no longer valid. It may have already been used or expired — request a new one below.",
  verification_failed:
    "That confirmation link is no longer valid. It may have already been used or expired — try signing in instead.",
};

export function callbackErrorMessage(code: string | null): string | null {
  if (!code) return null;
  return CALLBACK_MESSAGES[code] ?? "That link didn't work. Request a new one and try again.";
}