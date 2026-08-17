import { createServerSupabaseClient } from "./supabase/server";
import { getCurrentMonth } from "./utils";

export async function checkQuizQuota(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  const supabase = await createServerSupabaseClient();
  const month = getCurrentMonth();

  const { data: usage } = await supabase
    .from("usage_records")
    .select("quizzes_used")
    .eq("user_id", userId)
    .eq("month", month)
    .single();

  if (usage && usage.quizzes_used >= 10) {
    return { allowed: false, reason: "Limited to 10 quizzes per month." };
  }

  return { allowed: true };
}
