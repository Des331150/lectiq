import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { TopicSelector } from "@/components/topic-selector";
import { ProcessingStatus } from "@/components/processing-status";
import { AppShell } from "@/components/app-shell";

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
        <AppShell title="Processing">
          <ProcessingStatus documentId={id} />
        </AppShell>
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
    <AppShell title={doc.title}>
      <h1 className="text-2xl font-bold mb-1 break-words">{doc.title}</h1>
      <p className="text-muted-foreground mb-6">
        Select the topics you want to be quizzed on and choose your question format.
      </p>
      <TopicSelector topics={topics || []} documentId={id} />
    </AppShell>
  );
}
