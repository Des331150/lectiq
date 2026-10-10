import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/ui/link-button";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { formatLabel, isQuizFormat } from "@/lib/quiz-formats";

// The `document:documents(title)` select returns a PostgREST array join, not an
// object, so the row type is declared from the query rather than by hand.
type HistoryQuiz = {
  id: string;
  format: string;
  status: string;
  question_count: number | null;
  score: number | null;
  created_at: string;
  document: { title: string }[] | null;
};

/** Row status shown instead of a score for a quiz that isn't finished. */
const STATUS_LABEL: Record<string, string> = {
  generating: "Still building",
  ready: "Not attempted",
  completed: "Completed",
  error: "Failed to build",
};

export default async function HistoryPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: quizzes } = await supabase
    .from("quizzes")
    .select(`
      id, format, status, question_count, score, created_at,
      document:documents(title)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <AppShell title="Quiz History">
      <h1 className="text-2xl font-bold mb-6">Quiz History</h1>

      {quizzes && quizzes.length > 0 ? (
        <div className="space-y-2">
          {quizzes.map((quiz: HistoryQuiz) => {
            const title = quiz.document?.[0]?.title || "Unknown document";
            return (
            <Link key={quiz.id} href={`/quizzes/${quiz.id}/results`}>
              <div className="flex items-center justify-between gap-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{title}</p>
                  <p className="text-sm text-muted-foreground break-words">
                    {new Date(quiz.created_at).toLocaleDateString()}
                    {quiz.question_count != null && (
                      <>
                        {" · "}
                        {quiz.question_count}{" "}
                        {quiz.question_count === 1 ? "question" : "questions"}
                      </>
                    )}
                    {isQuizFormat(quiz.format) && (
                      <>
                        {" · "}
                        {formatLabel(quiz.format)}
                      </>
                    )}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  {quiz.score !== null ? (
                    <p className="text-lg font-bold">{Math.round(quiz.score)}%</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {STATUS_LABEL[quiz.status] ?? quiz.status}
                    </p>
                  )}
                </div>
              </div>
            </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg bg-muted/30">
          <p className="text-muted-foreground mb-4">No quizzes taken yet</p>
          <LinkButton href="/upload" variant="outline">
            Upload a document to get started
          </LinkButton>
        </div>
      )}
    </AppShell>
  );
}
