"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createCheckoutSession } from "@/lib/stripe";
import { revalidatePath } from "next/cache";

export async function checkoutAction(_prevState: unknown, formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  if (!user.email) return { error: "No email on account" };

  const plan = formData.get("plan") as string;
  const interval = formData.get("interval") as string;

  try {
    const session = await createCheckoutSession(
      user.id,
      user.email,
      plan as "basic" | "pro",
      interval === "yearly" ? "yearly" : "monthly"
    );

    if (!session.url) return { error: "Failed to create checkout session" };

    revalidatePath("/billing");

    return { success: true, url: session.url };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Checkout failed" };
  }
}
