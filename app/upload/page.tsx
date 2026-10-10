import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { getQuotaLimits } from "@/lib/quota";
import { getCurrentMonth } from "@/lib/utils";
import { UploadView } from "@/components/upload-view";

export default async function UploadPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const [limits, { data: usage }] = await Promise.all([
    getQuotaLimits(),
    supabase
      .from("usage_records")
      .select("kind, count")
      .eq("user_id", user.id)
      .eq("month", getCurrentMonth()),
  ]);

  const docsUsed = usage?.find((u) => u.kind === "document")?.count ?? 0;
  const docLimit = limits.document;

  return (
    <AppShell title="Upload">
      <UploadView docsUsed={docsUsed} docLimit={docLimit} />
    </AppShell>
  );
}
