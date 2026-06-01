"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { QuizQuestionDisplay } from "@/components/quiz-question";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import type { Quiz, QuizQuestion } from "@/types/database";

export default function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quizId, setQuizId] = useState<string | null>(null);

  useEffect(() => { params.then((p) => setQuizId(p.id)); }, [params]);

  useEffect(() => {
    if (!quizId) return;
    let interval: NodeJS.Timeout;

    async function loadQuiz() {
      const supabase = createClient();
      const { data: q } = await supabase.from("quizzes").select("*").eq("id", quizId).single();
      if (!q) { setError("Quiz not found"); setLoading(false); return; }
      if (q.status === "generating") {
        interval = setInterval(async () => {
          const { data: updated } = await supabase.from("quizzes").select("status").eq("id", quizId).single();
          if (updated?.status === "ready") {
            clearInterval(interval);
            loadQuiz();
          }
        }, 2000);
        return;
      }
      if (q.status !== "ready") { setError("Quiz is not ready"); setLoading(false); return; }
      setQuiz(q);
      const { data: qs } = await supabase.from("quiz_questions").select("*").eq("quiz_id", quizId).order("position");
      setQuestions(qs || []);
      setLoading(false);
    }
    loadQuiz();
    return () => { if (interval) clearInterval(interval); };
  }, [quizId]);

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/quiz/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quizId, answers }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Failed to submit"); setSubmitting(false); return; }
    router.push(`/quizzes/${quizId}/results`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center"><div className="text-center"><AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" /><p className="text-destructive">{error}</p></div></div>;

  const answeredCount = Object.keys(answers).length;
  const allAnswered = questions.every((q) => answers[q.id]?.trim().length > 0);

  return (
    <div className="min-h-screen p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Quiz</h1>
      <p className="text-muted-foreground mb-6">{questions.length} questions &middot; {answeredCount} answered</p>
      {questions.map((q, i) => (
        <QuizQuestionDisplay key={q.id} question={q} index={i} answer={answers[q.id] || ""} onAnswer={(a) => handleAnswer(q.id, a)} />
      ))}
      <Button className="w-full mt-4" onClick={handleSubmit} disabled={submitting || !allAnswered}>
        {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</> : `Submit Quiz (${answeredCount}/${questions.length} answered)`}
      </Button>
    </div>
  );
}
