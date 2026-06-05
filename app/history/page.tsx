import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";

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
          {quizzes.map((quiz: any) => (
            <Link key={quiz.id} href={`/quizzes/${quiz.id}/results`}>
              <div className="flex items-center justify-between gap-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{quiz.document?.title || "Unknown document"}</p>
                  <p className="text-sm text-muted-foreground break-words">
                    {new Date(quiz.created_at).toLocaleDateString()} &middot;{" "}
                    {quiz.question_count} questions &middot;{" "}
                    <span className="capitalize">{quiz.format.replace("_", " + ")}</span>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  {quiz.score !== null ? (
                    <p className="text-lg font-bold">{Math.round(quiz.score)}%</p>
                  ) : (
                    <p className="text-sm text-muted-foreground capitalize">{quiz.status}</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg bg-muted/30">
          <p className="text-muted-foreground mb-4">No quizzes taken yet</p>
          <Link href="/upload">
            <Button variant="outline">Upload a document to get started</Button>
          </Link>
        </div>
      )}
    </AppShell>
  );
}
