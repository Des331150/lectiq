"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProcessingStatusProps {
  documentId: string;
}

export function ProcessingStatus({ documentId }: ProcessingStatusProps) {
  const router = useRouter();
  const [message, setMessage] = useState("Processing your document...");
  const [failed, setFailed] = useState(false);

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
        return;
      }

      // Previously only "ready" cleared the interval, so a document that ended
      // in "error" (scanned PDF, extraction failure) polled indefinitely and
      // showed a spinner forever with no way forward.
      if (data?.status === "error") {
        clearInterval(interval);
        setFailed(true);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [documentId, router]);

  if (failed) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive font-medium mb-2">Processing failed</p>
        <p className="text-muted-foreground mb-6">
          We couldn&apos;t extract topics from this document. It may be scanned or image-based.
        </p>
        <Button variant="outline" onClick={() => router.push("/upload")}>
          Try another file
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-accent mx-auto mb-4" />
      <h1 className="text-xl font-bold mb-2">Extracting Topics</h1>
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
