"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";

interface ProcessingStatusProps {
  documentId: string;
  documentTitle?: string;
}

export function ProcessingStatus({ documentId, documentTitle }: ProcessingStatusProps) {
  const router = useRouter();
  const [title, setTitle] = useState(documentTitle || "");
  const [step, setStep] = useState<2 | 3>(2);
  const [stepDetail, setStepDetail] = useState("Reading document text and structure...");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [failed, setFailed] = useState(false);

  // Timer for elapsed seconds to give realistic user feedback
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update dynamic step detail based on elapsed time
  useEffect(() => {
    if (elapsedSeconds > 12) {
      setStepDetail("Finalizing topic taxonomy and study concepts...");
    } else if (elapsedSeconds > 5) {
      setStepDetail("Analyzing key terms, definitions, and slide takeaways...");
    } else {
      setStepDetail("Reading document text and structure...");
    }
  }, [elapsedSeconds]);

  // Polling Supabase for document readiness
  useEffect(() => {
    const supabase = createClient();

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("documents")
        .select("status, title")
        .eq("id", documentId)
        .single();

      if (data?.title && !title) {
        setTitle(data.title);
      }

      if (data?.status === "ready") {
        setStep(3);
        setStepDetail("Topics extracted! Loading quiz configuration...");
        clearInterval(interval);
        setTimeout(() => {
          router.refresh();
        }, 600);
        return;
      }

      if (data?.status === "error") {
        clearInterval(interval);
        setFailed(true);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [documentId, router, title]);

  if (failed) {
    return (
      <div className="max-w-xl mx-auto my-8 p-8 bg-card border border-destructive/40 rounded-lg text-center shadow-sm">
        <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold mb-2 text-foreground">Extraction Failed</h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
          We couldn&apos;t extract readable text from &ldquo;{title || "this document"}&rdquo;.
          This typically happens if the file contains scanned pages without selectable text, or if the file was corrupted.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button variant="default" onClick={() => router.push("/upload")}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Upload a different file
          </Button>
          <LinkButton href="/dashboard" variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </LinkButton>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto my-8 p-8 bg-card border border-border rounded-lg text-center shadow-sm">
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/15 text-accent-foreground text-xs font-semibold uppercase tracking-wider mb-4">
        <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        AI Processing
      </div>

      <h1 className="text-xl sm:text-2xl font-bold mb-2 text-foreground break-words">
        Analyzing &ldquo;{title || "Lecture Document"}&rdquo;
      </h1>
      <p className="text-sm text-muted-foreground mb-8">
        Extracting core study topics so you can generate custom practice quizzes.
      </p>

      {/* 3-Step Progress Timeline */}
      <div className="max-w-md mx-auto mb-8">
        <div className="flex items-center justify-between relative">
          {/* Connector Line 1 */}
          <div className="absolute top-4 left-[20%] right-[50%] h-0.5 bg-success z-0" />
          {/* Connector Line 2 */}
          <div
            className={`absolute top-4 left-[50%] right-[20%] h-0.5 z-0 transition-colors duration-500 ${
              step === 3 ? "bg-success" : "bg-border"
            }`}
          />

          {/* Node 1: Upload */}
          <div className="flex flex-col items-center z-10">
            <div className="w-8 h-8 rounded-full bg-success text-white flex items-center justify-center text-xs font-bold shadow-sm">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium mt-2 text-foreground">Uploaded</span>
          </div>

          {/* Node 2: Extracting */}
          <div className="flex flex-col items-center z-10">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                step === 3
                  ? "bg-success text-white"
                  : "bg-primary text-primary-foreground ring-4 ring-primary/15"
              }`}
            >
              {step === 3 ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Loader2 className="w-4 h-4 animate-spin text-accent" />
              )}
            </div>
            <span className="text-xs font-semibold mt-2 text-primary">Extracting</span>
          </div>

          {/* Node 3: Ready */}
          <div className="flex flex-col items-center z-10">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === 3
                  ? "bg-success text-white ring-4 ring-success/20"
                  : "bg-muted text-muted-foreground border border-border"
              }`}
            >
              3
            </div>
            <span
              className={`text-xs font-medium mt-2 ${
                step === 3 ? "text-foreground font-semibold" : "text-muted-foreground"
              }`}
            >
              Ready
            </span>
          </div>
        </div>
      </div>

      {/* Live Detail Callout */}
      <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-background border border-border text-xs text-muted-foreground">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-accent shrink-0" />
        <span>{stepDetail}</span>
        <span className="text-muted-foreground/60">({elapsedSeconds}s)</span>
      </div>
    </div>
  );
}
