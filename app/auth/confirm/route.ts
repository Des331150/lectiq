import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = safeRedirectPath(searchParams.get("next"));

  if (token_hash && (type === "signup" || type === "email")) {
    // Must be the SSR client, not the service-role admin client: verifyOtp has
    // to write the session cookies through setAll, and the admin client has no
    // cookie adapter at all. Using it here verified the token but left the
    // browser unauthenticated, so the redirect bounced straight to /auth/login.
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=verification_failed`);
}