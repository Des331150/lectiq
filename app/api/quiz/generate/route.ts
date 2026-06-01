import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { generateQuestions } from "@/lib/ai/generate-questions";
import { checkQuizQuota } from "@/lib/quota";
import { getCurrentMonth } from "@/lib/utils";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { documentId, topicIds, format } = await request.json();
  if (!documentId || !topicIds || !format) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data: doc } = await supabase
    .from("documents")
    .select("id")
    .eq("id", documentId)
    .eq("user_id", user.id)
    .single();

  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  const quota = await checkQuizQuota(user.id);
  if (!quota.allowed) return NextResponse.json({ error: quota.reason }, { status: 403 });

  const { data: topics } = await supabase
    .from("topics")
    .select("*")
    .in("id", topicIds)
    .eq("document_id", documentId);

  if (!topics || topics.length === 0) {
    return NextResponse.json({ error: "No topics found" }, { status: 400 });
  }

  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .insert({ user_id: user.id, document_id: documentId, format, status: "generating" })
    .select()
    .single();

  if (quizError || !quiz) {
    return NextResponse.json({ error: "Failed to create quiz" }, { status: 500 });
  }

  try {
    const questions = await generateQuestions(
      topics.map((t) => ({ id: t.id, title: t.title, content: t.content })),
      format
    );

    const questionRows = questions.map((q, i) => ({
      quiz_id: quiz.id,
      type: q.type,
      question_text: q.question_text,
      options: q.options || null,
      correct_answer: q.correct_answer || null,
      model_answer: q.model_answer || null,
      topic_id: q.topic_id,
      position: i,
    }));

    await supabase.from("quiz_questions").insert(questionRows);
    await supabase.from("quizzes").update({ status: "ready", question_count: questions.length }).eq("id", quiz.id);

    const month = getCurrentMonth();
    const { data: existing } = await supabase
      .from("usage_records")
      .select("quizzes_used, questions_generated")
      .eq("user_id", user.id)
      .eq("month", month)
      .single();

    if (existing) {
      await supabase
        .from("usage_records")
        .update({
          quizzes_used: (existing.quizzes_used || 0) + 1,
          questions_generated: (existing.questions_generated || 0) + questions.length,
        })
        .eq("user_id", user.id)
        .eq("month", month);
    } else {
      await supabase
        .from("usage_records")
        .insert({ user_id: user.id, month, quizzes_used: 1, questions_generated: questions.length });
    }

    return NextResponse.json({ quizId: quiz.id });
  } catch (err) {
    await supabase.from("quizzes").update({ status: "error" }).eq("id", quiz.id);
    return NextResponse.json({ error: "Failed to generate questions" }, { status: 500 });
  }
}
