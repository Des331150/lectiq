"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { QuizResults } from "@/components/quiz-results";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import type { Quiz, QuizQuestion, QuizAnswer } from "@/types/database";

export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [quizId, setQuizId] = useState<string | null>(null);

  useEffect(() => { params.then((p) => setQuizId(p.id)); }, [params]);

  useEffect(() => {
    if (!quizId) return;
    async function loadResults() {
      const supabase = createClient();
      const { data: q } = await supabase.from("quizzes").select("*").eq("id", quizId).single();
      if (!q || q.status !== "completed") { setLoading(false); return; }
      setQuiz(q);
      const { data: qs } = await supabase.from("quiz_questions").select("*").eq("quiz_id", quizId).order("position");
      setQuestions(qs || []);
      const questionIds = qs?.map((q) => q.id) || [];
      const { data: ans } = await supabase.from("quiz_answers").select("*").in("question_id", questionIds);
      setAnswers(ans || []);
      setLoading(false);
    }
    loadResults();
  }, [quizId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!quiz) return <div className="min-h-screen flex items-center justify-center"><div className="text-center"><AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" /><p className="text-destructive">Results not available yet</p></div></div>;

  const mcqAnswers = answers.filter((a) => a.is_correct !== null);
  const frAnswers = answers.filter((a) => a.ai_score !== null);
  const correctMcq = mcqAnswers.filter((a) => a.is_correct).length;
  const avgFrScore = frAnswers.length > 0 ? frAnswers.reduce((acc, a) => acc + (a.ai_score || 0), 0) / frAnswers.length : null;

  return (
    <div className="min-h-screen p-6 max-w-2xl mx-auto">
      <QuizResults score={quiz.score || 0} totalQuestions={questions.length} correctMcq={correctMcq} totalMcq={mcqAnswers.length} averageFrScore={avgFrScore} />

      <div className="mt-8 space-y-4">
        {questions.map((question, i) => {
          const answer = answers.find((a) => a.question_id === question.id);
          return (
            <div key={question.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="font-medium">Question {i + 1}</p>
                {question.type === "mcq" ? (
                  <span className={`text-sm font-medium shrink-0 ${answer?.is_correct ? "text-green-600" : "text-red-600"}`}>
                    {answer?.is_correct ? "Correct" : "Incorrect"}
                  </span>
                ) : (
                  <span className="text-sm font-medium shrink-0">{answer && answer.ai_score !== null ? `${answer.ai_score}%` : "\u2014"}</span>
                )}
              </div>
              <p className="text-sm mb-2 break-words">{question.question_text}</p>
              {question.type === "mcq" && question.options && (
                <div className="text-sm text-muted-foreground mb-1 break-words">
                  Your answer: {answer?.user_answer || "\u2014"} &middot; Correct: {question.correct_answer}
                </div>
              )}
              {question.type === "free_response" && (
                <div className="space-y-2">
                  <div className="text-sm break-words"><span className="font-medium text-muted-foreground">Your answer: </span>{answer?.user_answer}</div>
                  {answer?.ai_feedback && <div className="text-sm rounded-md bg-muted p-3 break-words"><span className="font-medium text-muted-foreground">Feedback: </span>{answer.ai_feedback}</div>}
                  {question.model_answer && <div className="text-sm text-muted-foreground break-words"><span className="font-medium">Model answer: </span>{question.model_answer}</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-8">
        <Link href="/dashboard" className="flex-1"><Button variant="outline" className="w-full">Back to Dashboard</Button></Link>
        <Link href={`/documents/${quiz.document_id}/topics`} className="flex-1"><Button className="w-full">Take Another Quiz</Button></Link>
      </div>
    </div>
  );
}
