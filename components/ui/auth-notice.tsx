import { AlertCircle, CheckCircle2 } from "lucide-react";

interface AuthNoticeProps {
  tone: "error" | "success";
  children: React.ReactNode;
}

/**
 * A form-level message in a live region.
 *
 * Errors on these forms appear after a submit, with focus still in the field the
 * person was typing in. Without a live region a screen reader user gets no
 * indication that anything failed until they navigate away from the input.
 */
export function AuthNotice({ tone, children }: AuthNoticeProps) {
  const isError = tone === "error";
  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      className={`flex items-start gap-2.5 rounded-md border p-3 ${
        isError
          ? "border-destructive bg-destructive/5"
          : "border-success bg-success-surface"
      }`}
    >
      {isError ? (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
      ) : (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
      )}
      <p
        className={`text-sm ${isError ? "text-destructive" : "text-success"}`}
      >
        {children}
      </p>
    </div>
  );
}