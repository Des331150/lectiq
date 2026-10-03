import { createServerSupabaseClient } from "./supabase/server";
import { getCurrentMonth } from "./utils";

export type QuotaKind = "quiz" | "document";

export const QUOTA_EXCEEDED_MESSAGE: Record<QuotaKind, string> = {
  quiz: "Limited to 10 quizzes per month.",
  document: "Limited to 10 documents per month.",
};

export const FALLBACK_QUOTA_LIMITS: Record<QuotaKind, number> = {
  quiz: 10,
  document: 10,
};

/**
 * Monthly limits live in the quota_limits table (migration 00008) so the check
 * and the enforcement can't drift apart. Falls back to the compiled-in values
 * if the read fails, so a transient error never locks a user out of uploading.
 */
export async function getQuotaLimits(): Promise<Record<QuotaKind, number>> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("quota_limits").select("kind, monthly_limit");
  if (!data || data.length === 0) return FALLBACK_QUOTA_LIMITS;

  const limits = { ...FALLBACK_QUOTA_LIMITS };
  for (const row of data as { kind: QuotaKind; monthly_limit: number }[]) {
    if (row.kind in limits) limits[row.kind] = row.monthly_limit;
  }
  return limits;
}

/**
 * Claims one unit of quota for the current month. The claim is atomic and is
 * rolled back inside the database when it would exceed the limit.
 *
 * The caller must call releaseQuota if the work it guards subsequently fails.
 */
export async function claimQuota(userId: string, kind: QuotaKind): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("claim_quota", {
    p_user_id: userId,
    p_month: getCurrentMonth(),
    p_kind: kind,
  });
  if (error) {
    console.error(`Failed to claim ${kind} quota:`, error.message);
    return true;
  }
  return data === true;
}

export async function releaseQuota(userId: string, kind: QuotaKind): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("release_quota", {
    p_user_id: userId,
    p_month: getCurrentMonth(),
    p_kind: kind,
  });
  if (error) console.error(`Failed to release ${kind} quota:`, error.message);
}

export async function recordQuestionsGenerated(userId: string, count: number): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("record_questions", {
    p_user_id: userId,
    p_month: getCurrentMonth(),
    p_count: count,
  });
  if (error) console.error("Failed to record generated questions:", error.message);
}