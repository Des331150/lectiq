import { createServerSupabaseClient } from "./supabase/server";
import { getCurrentMonth } from "./utils";

export async function checkUploadQuota(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  return { allowed: true };
}

export async function checkQuizQuota(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  const supabase = await createServerSupabaseClient();
  const month = getCurrentMonth();

  const { data: user } = await supabase
    .from("users")
    .select("subscription_status")
    .eq("id", userId)
    .single();

  if (user?.subscription_status === "pro") {
    return { allowed: true };
  }

  const { data: usage } = await supabase
    .from("usage_records")
    .select("quizzes_used")
    .eq("user_id", userId)
    .eq("month", month)
    .single();

  if (usage && usage.quizzes_used >= 10) {
    return { allowed: false, reason: "Basic plan limited to 10 quizzes per month. Upgrade to Pro for unlimited quizzes." };
  }

  return { allowed: true };
}
