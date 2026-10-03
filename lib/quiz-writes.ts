import { createAdminClient } from "./supabase/admin";

/**
 * Writes to the `quizzes` table using the service-role client.
 *
 * Migration 00008 drops the blanket CRUD policy on `quizzes`, leaving the
 * browser client able to select, insert and delete its own rows but not update
 * them. That closes a real hole: `score` and `status` were previously
 * writable straight from the browser, so a signed-in user could set their own
 * score to 100.
 *
 * The service role bypasses RLS entirely, so every query here MUST constrain on
 * user_id. Treat the id arguments as untrusted.
 */

export type QuizStatusPatch = {
  status?: "generating" | "ready" | "completed" | "error";
  score?: number | null;
  question_count?: number;
};

async function updateOwnQuiz(userId: string, quizId: string, patch: QuizStatusPatch) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("quizzes")
    .update(patch)
    .eq("id", quizId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(error.message);
  // No row means the quiz does not exist or is not owned by this user. Callers
  // already verified ownership, so this is a lost race rather than an attack.
  if (!data) throw new Error("Quiz not found");
}

export async function markQuizReady(userId: string, quizId: string, questionCount: number) {
  await updateOwnQuiz(userId, quizId, { status: "ready", question_count: questionCount });
}

export async function markQuizError(userId: string, quizId: string) {
  await updateOwnQuiz(userId, quizId, { status: "error" });
}

export async function markQuizCompleted(userId: string, quizId: string, score: number) {
  await updateOwnQuiz(userId, quizId, { status: "completed", score });
}