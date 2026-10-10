import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { gradeFreeResponse } from "@/lib/ai/grade-answer";
import { markQuizCompleted } from "@/lib/quiz-writes";

export const maxDuration = 300;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_ANSWER_CHARS = 10_000;

type AnswerRow = {
  question_id: string;
  user_answer: string;
  is_correct?: boolean;
  ai_score?: number;
  ai_feedback?: string;
  source_quote?: string | null;
  what_was_right?: string | null;
  what_was_missing?: string | null;
};

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { quizId, answers } = (body ?? {}) as Record<string, unknown>;

  if (typeof quizId !== "string" || !UUID_RE.test(quizId)) {
    return NextResponse.json({ error: "Invalid quizId" }, { status: 400 });
  }
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
    return NextResponse.json({ error: "Invalid answers" }, { status: 400 });
  }

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("*")
    .eq("id", quizId)
    .eq("user_id", user.id)
    .single();

  if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

  // A quiz is only submittable once its questions exist. Without this guard a
  // request arriving while status is still 'generating' would grade an empty
  // question set and write a misleading score of 0.
  if (quiz.status !== "ready" && quiz.status !== "completed") {
    return NextResponse.json({ error: "Quiz is not ready" }, { status: 409 });
  }

  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("*")
    .eq("quiz_id", quizId)
    .order("position");

  if (!questions || questions.length === 0) {
    return NextResponse.json({ error: "No questions found" }, { status: 400 });
  }

  const answerRows: AnswerRow[] = [];

  for (const question of questions) {
    const raw = (answers as Record<string, unknown>)[question.id];
    if (typeof raw !== "string") continue;
    const userAnswer = raw.trim();
    if (!userAnswer) continue;

    const answerRow: AnswerRow = {
      question_id: question.id,
      user_answer: userAnswer.slice(0, MAX_ANSWER_CHARS),
    };

    if (question.type === "mcq") {
      answerRow.is_correct = userAnswer === question.correct_answer;
    } else {
      let context = "";
      if (question.topic_id) {
        const { data: topic } = await supabase
          .from("topics")
          .select("content")
          .eq("id", question.topic_id)
          .single();
        context = topic?.content || "";
      }
      try {
        const grading = await gradeFreeResponse(
          question.question_text,
          answerRow.user_answer,
          context || question.model_answer || ""
        );
        answerRow.ai_score = Math.max(0, Math.min(100, Math.round(Number(grading.score) || 0)));
        answerRow.ai_feedback = String(grading.feedback ?? "").slice(0, 2000);
        // Best-effort fields. gradeFreeResponse already degrades a missing or
        // unverified citation to null rather than throwing, so a sparse model
        // response costs the citation and nothing else.
        answerRow.source_quote = grading.sourceQuote;
        answerRow.what_was_right = grading.whatWasRight;
        answerRow.what_was_missing = grading.whatWasMissing;
      } catch {
        answerRow.ai_score = 0;
        answerRow.ai_feedback = "Grading failed. Please review manually.";
        answerRow.source_quote = null;
        answerRow.what_was_right = null;
        answerRow.what_was_missing = null;
      }
    }
    answerRows.push(answerRow);
  }

  if (answerRows.length === 0) {
    return NextResponse.json({ error: "No answers provided" }, { status: 400 });
  }

  // Resubmitting replaces the previous attempt rather than appending to it.
  //
  // Delete-then-insert rather than upsert: quiz_answers deliberately has no
  // UPDATE policy, so a client can never rewrite its own ai_score/is_correct.
  // The unique index on question_id (migration 00008) means this can never leave
  // duplicate rows behind, so a quiz can be retried without double-counting.
  const questionIds = questions.map((q) => q.id);
  const { error: deleteError } = await supabase
    .from("quiz_answers")
    .delete()
    .in("question_id", questionIds);
  if (deleteError) {
    console.error("Failed to clear previous answers:", deleteError);
    return NextResponse.json({ error: "Failed to save answers" }, { status: 500 });
  }

  const { error: insertError } = await supabase.from("quiz_answers").insert(answerRows);
  if (insertError) {
    console.error("Failed to save answers:", insertError);
    return NextResponse.json({ error: "Failed to save answers" }, { status: 500 });
  }

  let finalScore = 0;
  let mcqCorrect = 0;
  let mcqTotal = 0;
  let frScore = 0;
  let frTotal = 0;

  for (const row of answerRows) {
    if (row.is_correct !== undefined) {
      mcqTotal++;
      if (row.is_correct) mcqCorrect++;
    }
    if (row.ai_score !== undefined) {
      frTotal++;
      frScore += row.ai_score;
    }
  }

  const mcqPct = mcqTotal > 0 ? mcqCorrect / mcqTotal : 0;
  const frPct = frTotal > 0 ? frScore / (frTotal * 100) : 0;
  if (mcqTotal > 0 && frTotal > 0) finalScore = mcqPct * 50 + frPct * 50;
  else if (mcqTotal > 0) finalScore = mcqPct * 100;
  else finalScore = frPct * 100;

  const score = Math.round(finalScore);
  try {
    await markQuizCompleted(user.id, quizId, score);
  } catch (err) {
    console.error("Failed to finalize quiz:", err);
    return NextResponse.json({ error: "Failed to save score" }, { status: 500 });
  }

  return NextResponse.json({ success: true, score });
}