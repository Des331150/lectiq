import { AlertCircle } from "lucide-react";
import { LinkButton } from "@/components/ui/link-button";

interface QuizDeadEndProps {
  title: string;
  message: string;
  /** The primary way out. Rendered as a solid button-styled link. */
  primaryAction?: { label: string; href: string };
  /** The secondary way out. Rendered as an outline button-styled link. */
  secondaryAction?: { label: string; href: string };
}

/**
 * A terminal quiz state with somewhere to go.
 *
 * The quiz and results pages previously rendered a bare icon and one sentence
 * for four different failures (generation error, not ready, missing results,
 * quiz not found). A user who hit any of them had no route back except the
 * browser's back button — and on /quizzes/[id] there was no navigation at all,
 * because the page rendered outside AppShell.
 *
 * The page supplies AppShell so the sidebar is present; this adds the
 * plain-language explanation and the actions.
 */
export function QuizDeadEnd({ title, message, primaryAction, secondaryAction }: QuizDeadEndProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          <p className="mt-1.5 text-sm text-muted-foreground break-words">{message}</p>
          {(primaryAction || secondaryAction) && (
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              {primaryAction && (
                <LinkButton href={primaryAction.href} className="w-full sm:w-auto">
                  {primaryAction.label}
                </LinkButton>
              )}
              {secondaryAction && (
                <LinkButton href={secondaryAction.href} variant="outline" className="w-full sm:w-auto">
                  {secondaryAction.label}
                </LinkButton>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}