import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { safeRedirectPath } from "@/lib/utils";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as "signup" | "email" | null;
  const next = safeRedirectPath(searchParams.get("next"));

  if (token_hash && type) {
    const supabase = createAdminClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type === "signup" ? "signup" : "email",
    });

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=verification_failed`);
}
