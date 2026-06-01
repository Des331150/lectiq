import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

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
    <div className="min-h-screen p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-6">Quiz History</h1>

      {quizzes && quizzes.length > 0 ? (
        <div className="space-y-2">
          {quizzes.map((quiz: any) => (
            <Link key={quiz.id} href={`/quizzes/${quiz.id}/results`}>
              <div className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                <div>
                  <p className="font-medium">{quiz.document?.title || "Unknown document"}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(quiz.created_at).toLocaleDateString()} &middot;{" "}
                    {quiz.question_count} questions &middot;{" "}
                    <span className="capitalize">{quiz.format.replace("_", " + ")}</span>
                  </p>
                </div>
                <div className="text-right">
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
    </div>
  );
}
