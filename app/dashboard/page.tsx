import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DashboardStats } from "@/components/dashboard-stats";
import { DocumentCard } from "@/components/document-card";
import { Sidebar } from "@/components/sidebar";
import { getCurrentMonth } from "@/lib/utils";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data: topicCounts } = await supabase
    .from("topics")
    .select("document_id, id")
    .in("document_id", documents?.map((d) => d.id) || []);

  const topicCountMap = new Map<string, number>();
  topicCounts?.forEach((t) => {
    topicCountMap.set(t.document_id, (topicCountMap.get(t.document_id) || 0) + 1);
  });

  const topicsExtracted = topicCounts?.length || 0;

  const { data: quizCounts } = await supabase
    .from("quizzes")
    .select("document_id, id")
    .in("document_id", documents?.map((d) => d.id) || []);

  const quizCountMap = new Map<string, number>();
  quizCounts?.forEach((q) => {
    quizCountMap.set(q.document_id, (quizCountMap.get(q.document_id) || 0) + 1);
  });

  const month = getCurrentMonth();
  const { data: usage } = await supabase
    .from("usage_records")
    .select("*")
    .eq("user_id", user.id)
    .eq("month", month)
    .single();

  const { data: quizData } = await supabase
    .from("quizzes")
    .select("score")
    .eq("user_id", user.id)
    .not("score", "is", null);

  const avgScore =
    quizData && quizData.length > 0
      ? quizData.reduce((acc, q) => acc + (q.score || 0), 0) / quizData.length
      : null;

  const isPro = userData?.subscription_status === "pro";

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex justify-center">
        <div className="w-full py-6 px-6 max-w-4xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground text-sm">
                {isPro ? "Pro plan" : `Free plan \u2014 ${documents?.length || 0}/3 documents used`}
              </p>
            </div>
            <Link href="/upload">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </Link>
          </div>

          <div className="mb-8">
            <DashboardStats
              documentsUsed={documents?.length || 0}
              documentsLimit={3}
              quizzesUsed={usage?.quizzes_used || 0}
              quizzesLimit={5}
              averageScore={avgScore}
              topicsExtracted={topicsExtracted}
              isPro={isPro}
            />
          </div>

          <h2 className="text-lg font-semibold mb-4">Documents</h2>

          {documents && documents.length > 0 ? (
            <div className="space-y-3">
              {documents.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  topicCount={topicCountMap.get(doc.id) || 0}
                  quizCount={quizCountMap.get(doc.id) || 0}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg bg-muted/30">
              <p className="text-muted-foreground mb-4">No documents yet</p>
              <Link href="/upload">
                <Button variant="outline">Upload your first document</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
