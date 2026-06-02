"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

interface ProcessingStatusProps {
  documentId: string;
}

export function ProcessingStatus({ documentId }: ProcessingStatusProps) {
  const router = useRouter();
  const [message, setMessage] = useState("Processing your document...");

  useEffect(() => {
    const supabase = createClient();
    let attempts = 0;

    const interval = setInterval(async () => {
      attempts++;
      setMessage(
        attempts > 5
          ? "Still processing... AI extraction can take a minute"
          : "Processing your document..."
      );

      const { data } = await supabase
        .from("documents")
        .select("status")
        .eq("id", documentId)
        .single();

      if (data?.status === "ready") {
        clearInterval(interval);
        router.refresh();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [documentId, router]);

  return (
    <div className="text-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-accent mx-auto mb-4" />
      <h1 className="text-xl font-bold mb-2">Extracting Topics</h1>
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
