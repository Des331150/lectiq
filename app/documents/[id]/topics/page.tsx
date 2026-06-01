import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { TopicSelector } from "@/components/topic-selector";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function TopicsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: doc } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!doc) notFound();
  if (doc.status !== "ready") redirect(`/documents/${id}/topics?processing=true`);

  const { data: topics } = await supabase
    .from("topics")
    .select("*")
    .eq("document_id", id)
    .order("position");

  return (
    <div className="min-h-screen p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-1">{doc.title}</h1>
      <p className="text-muted-foreground mb-6">
        Select the topics you want to be quizzed on and choose your question format.
      </p>
      <TopicSelector topics={topics || []} documentId={id} />
    </div>
  );
}
