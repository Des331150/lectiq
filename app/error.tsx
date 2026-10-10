"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // The error was previously destructured and dropped, which was the only lint
  // error left in the codebase. Next's digest is the only handle on what
  // actually failed once the message has been replaced for the user, so it is
  // logged rather than discarded.
  useEffect(() => {
    console.error("Unhandled application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="mb-4 text-4xl font-bold text-destructive">Something went wrong</h1>
      <p className="mb-2 max-w-sm text-muted-foreground">
        An unexpected error occurred. Your uploaded documents and quizzes are unaffected.
      </p>
      {error.digest && (
        <p className="mb-8 font-mono text-xs text-muted-foreground">
          Reference: {error.digest}
        </p>
      )}
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
