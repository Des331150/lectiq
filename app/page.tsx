import type { Metadata } from "next";
import Image from "next/image";
import { LinkButton } from "@/components/ui/link-button";

/**
 * Scoped to the landing page rather than the root layout, so the authenticated
 * screens don't inherit a canonical tag pointing here.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const STEPS = [
  {
    num: "1",
    title: "Upload",
    desc: "Drop your PDF or PowerPoint. We extract the key topics automatically.",
  },
  {
    num: "2",
    title: "Generate",
    desc: "Pick the topics you want to study. Choose multiple choice, free response, or both.",
  },
  {
    num: "3",
    title: "Learn",
    desc: "Take the quiz, get AI-graded feedback, and track your progress.",
  },
];

const FAQS = [
  {
    q: "How does the AI grading work?",
    a: "Free-response answers are scored against your lecture material, not a fixed answer key. You get feedback on what you missed and why, and the line of your document that settles it.",
  },
  {
    q: "What file types can I upload?",
    a: "PDF and PowerPoint, up to 40MB. Scanned PDFs without selectable text can't be read.",
  },
  {
    q: "How is Lectiq different from Quizlet or Anki?",
    a: "Those tools test recognition. Lectiq tests understanding. You can't guess your way through a free-response question, and we grade it against your actual material.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-6">
        <div className="text-lg font-bold tracking-tight">Lectiq</div>
        <div className="flex items-center gap-2 sm:gap-3">
          <LinkButton href="/auth/login" variant="ghost" size="sm">
            Sign in
          </LinkButton>
          <LinkButton href="/auth/register" size="sm" className="font-medium">
            Get started
          </LinkButton>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 md:flex-row">
          <div className="flex-1">
            <h1 className="mb-4 text-balance text-[clamp(2rem,5vw,3.25rem)] font-bold leading-[1.15] tracking-tight">
              Turn your lecture notes
              <br className="hidden sm:inline" />{" "}
              <span className="text-accent">into quizzes</span>
            </h1>
            <p className="mb-7 max-w-[65ch] text-base leading-relaxed text-muted-foreground">
              Upload a lecture PDF or PowerPoint. Pick the topics. Get a quiz graded
              against your own material, with feedback on what you missed and why.
            </p>
            <div className="flex flex-wrap gap-2.5">
              <LinkButton href="/auth/register" size="lg" className="font-medium">
                Start studying
              </LinkButton>
              <LinkButton
                href="/auth/login"
                variant="outline"
                size="lg"
                className="font-medium"
              >
                Sign in
              </LinkButton>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Free while you have 10 documents a month.
            </p>
          </div>
          <div className="w-full flex-1">
            <Image
              src="/dashboard-hero-v2.png"
              alt="Lectiq dashboard showing the study queue"
              width={1200}
              height={800}
              // The hero occupies the right half of a two-column grid above a
              // 900px breakpoint, and the full width below it. A 50vw cap made
              // the browser pick the 640w candidate for a slot that renders up
              // to 1200px wide, so the image arrived upscaled.
              sizes="(max-width: 900px) 100vw, 50vw"
              className="h-auto w-full rounded-xl border border-border shadow-sm"
            />
          </div>
        </div>

        <div className="border-t border-border px-4 py-12 sm:px-6">
          <h2 className="mb-8 text-center text-xs font-medium uppercase tracking-[1.5px] text-accent">
            How it works
          </h2>
          <div className="mx-auto grid max-w-3xl grid-cols-1 gap-8 md:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.num} className="text-center">
                <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground">
                  {step.num}
                </div>
                <h3 className="mb-1.5 text-base font-semibold">{step.title}</h3>
                <p className="mx-auto max-w-[240px] text-sm leading-relaxed text-muted-foreground">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border px-4 py-12 sm:px-6">
          <h2 className="mb-8 text-center text-xs font-medium uppercase tracking-[1.5px] text-accent">
            FAQ
          </h2>
          <div className="mx-auto max-w-2xl space-y-6">
            {FAQS.map((faq) => (
              <div key={faq.q}>
                <h3 className="mb-1 text-base font-semibold">{faq.q}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border px-4 py-12 text-center sm:px-6">
          <h2 className="mb-2 text-xl font-bold">Ready to start?</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Upload a lecture and take your first quiz in a few minutes.
          </p>
          <LinkButton href="/auth/register" size="lg" className="font-medium">
            Start studying
          </LinkButton>
        </div>
      </main>

      <footer className="border-t border-border px-4 py-5 text-center text-sm text-muted-foreground sm:px-6">
        <p>Lectiq</p>
      </footer>
    </div>
  );
}