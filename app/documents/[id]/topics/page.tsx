import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { TopicSelector } from "@/components/topic-selector";
import { ProcessingStatus } from "@/components/processing-status";
import { Sidebar } from "@/components/sidebar";

export default async function TopicsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ processing?: string }>;
}) {
  const { id } = await params;
  const { processing } = await searchParams;
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

  if (doc.status !== "ready") {
    if (processing === "true") {
      return (
        <div className="flex min-h-screen bg-background">
          <Sidebar />
          <div className="flex-1 flex justify-center">
            <ProcessingStatus documentId={id} />
          </div>
        </div>
      );
    }
    redirect(`/documents/${id}/topics?processing=true`);
  }

  const { data: topics } = await supabase
    .from("topics")
    .select("*")
    .eq("document_id", id)
    .order("position");

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex justify-center">
        <div className="w-full py-6 px-6 max-w-2xl">
          <h1 className="text-2xl font-bold mb-1">{doc.title}</h1>
          <p className="text-muted-foreground mb-6">
            Select the topics you want to be quizzed on and choose your question format.
          </p>
          <TopicSelector topics={topics || []} documentId={id} />
        </div>
      </div>
    </div>
  );
}
