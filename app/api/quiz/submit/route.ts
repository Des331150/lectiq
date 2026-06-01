import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { gradeFreeResponse } from "@/lib/ai/grade-answer";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { quizId, answers } = await request.json();
  if (!quizId || !answers) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("*")
    .eq("id", quizId)
    .eq("user_id", user.id)
    .single();

  if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("*")
    .eq("quiz_id", quizId)
    .order("position");

  if (!questions) return NextResponse.json({ error: "No questions found" }, { status: 404 });

  const answerRows = [];

  for (const question of questions) {
    const userAnswer = answers[question.id];
    if (!userAnswer) continue;

    const answerRow: any = {
      question_id: question.id,
      user_answer: userAnswer,
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
          userAnswer,
          context || question.model_answer || ""
        );
        answerRow.ai_score = grading.score;
        answerRow.ai_feedback = grading.feedback;
      } catch {
        answerRow.ai_score = 0;
        answerRow.ai_feedback = "Grading failed. Please review manually.";
      }
    }
    answerRows.push(answerRow);
  }

  await supabase.from("quiz_answers").insert(answerRows);

  const { data: savedAnswers } = await supabase
    .from("quiz_answers")
    .select("is_correct, ai_score")
    .in("question_id", questions.map((q) => q.id));

  let finalScore = 0;
  if (savedAnswers) {
    let mcqCorrect = 0, mcqTotal = 0, frScore = 0, frTotal = 0;
    for (const ans of savedAnswers) {
      if (ans.is_correct !== null) { mcqTotal++; if (ans.is_correct) mcqCorrect++; }
      if (ans.ai_score !== null) { frTotal++; frScore += ans.ai_score; }
    }
    const mcqPct = mcqTotal > 0 ? mcqCorrect / mcqTotal : 0;
    const frPct = frTotal > 0 ? frScore / (frTotal * 100) : 0;
    if (mcqTotal > 0 && frTotal > 0) finalScore = (mcqPct * 50 + frPct * 50);
    else if (mcqTotal > 0) finalScore = mcqPct * 100;
    else finalScore = frPct * 100;
  }

  await supabase.from("quizzes").update({ status: "completed", score: Math.round(finalScore) }).eq("id", quizId);
  return NextResponse.json({ success: true, score: Math.round(finalScore) });
}
