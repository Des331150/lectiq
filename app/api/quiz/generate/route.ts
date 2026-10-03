import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { generateQuestions } from "@/lib/ai/generate-questions";
import { markQuizError, markQuizReady } from "@/lib/quiz-writes";
import {
  claimQuota,
  releaseQuota,
  recordQuestionsGenerated,
  QUOTA_EXCEEDED_MESSAGE,
} from "@/lib/quota";

export const maxDuration = 300;

const FORMATS = ["mcq", "free_response", "both"] as const;
type QuizFormat = (typeof FORMATS)[number];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_TOPIC_IDS = 100;

function isFormat(value: unknown): value is QuizFormat {
  return typeof value === "string" && (FORMATS as readonly string[]).includes(value);
}

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

  const { documentId, topicIds, format } = (body ?? {}) as Record<string, unknown>;

  if (typeof documentId !== "string" || !UUID_RE.test(documentId)) {
    return NextResponse.json({ error: "Invalid documentId" }, { status: 400 });
  }
  if (!Array.isArray(topicIds) || topicIds.length === 0) {
    return NextResponse.json({ error: "At least one topic is required" }, { status: 400 });
  }
  if (topicIds.length > MAX_TOPIC_IDS) {
    return NextResponse.json({ error: `Too many topics selected` }, { status: 400 });
  }
  if (!topicIds.every((id) => typeof id === "string" && UUID_RE.test(id))) {
    return NextResponse.json({ error: "Invalid topicIds" }, { status: 400 });
  }
  if (!isFormat(format)) {
    return NextResponse.json({ error: "Invalid format" }, { status: 400 });
  }

  const { data: doc } = await supabase
    .from("documents")
    .select("id, status")
    .eq("id", documentId)
    .eq("user_id", user.id)
    .single();

  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });
  if (doc.status !== "ready") {
    return NextResponse.json({ error: "Document is not ready" }, { status: 409 });
  }

  const { data: topics } = await supabase
    .from("topics")
    .select("*")
    .in("id", topicIds)
    .eq("document_id", documentId);

  if (!topics || topics.length === 0) {
    return NextResponse.json({ error: "No topics found" }, { status: 400 });
  }

  // Claimed atomically and released if generation fails, so a failure costs the
  // user nothing and concurrent requests can't both slip past the cap.
  const claimed = await claimQuota(user.id, "quiz");
  if (!claimed) {
    return NextResponse.json({ error: QUOTA_EXCEEDED_MESSAGE.quiz }, { status: 403 });
  }

  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .insert({ user_id: user.id, document_id: documentId, format, status: "generating" })
    .select()
    .single();

  if (quizError || !quiz) {
    await releaseQuota(user.id, "quiz");
    return NextResponse.json({ error: "Failed to create quiz" }, { status: 500 });
  }

  try {
    const questions = await generateQuestions(
      topics.map((t) => ({
        id: t.id,
        title: t.title,
        content: t.content,
        source_content: t.source_content,
      })),
      format
    );

    if (questions.length === 0) {
      await markQuizError(user.id, quiz.id);
      await releaseQuota(user.id, "quiz");
      return NextResponse.json({ error: "Failed to generate questions" }, { status: 500 });
    }

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

    const { error: insertError } = await supabase.from("quiz_questions").insert(questionRows);
    if (insertError) throw new Error(`Failed to insert questions: ${insertError.message}`);

    await markQuizReady(user.id, quiz.id, questions.length);

    await recordQuestionsGenerated(user.id, questions.length);

    return NextResponse.json({ quizId: quiz.id });
  } catch (err) {
    console.error("Quiz generation failed:", err);
    await markQuizError(user.id, quiz.id);
    await releaseQuota(user.id, "quiz");
    return NextResponse.json({ error: "Failed to generate questions" }, { status: 500 });
  }
}