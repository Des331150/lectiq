"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createCheckoutSession } from "@/lib/stripe";

export async function checkoutAction(previousState: unknown, formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  if (!user.email) return { error: "No email on account" };

  const plan = formData.get("plan") as string;
  const intervalParam = formData.get("interval") as string;
  const interval = intervalParam === "yearly" ? "yearly" : "monthly";

  try {
    const session = await createCheckoutSession(
      user.id,
      user.email,
      plan as "basic" | "pro",
      interval
    );

    if (!session.url) return { error: "Failed to create checkout session" };

    return { url: session.url };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Checkout failed" };
  }
}
