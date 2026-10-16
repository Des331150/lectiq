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
        <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-12 sm:px-6 sm:py-14">
          <div className="max-w-2xl">
            <h1 className="mb-4 text-balance text-[clamp(2rem,5vw,3.25rem)] font-bold leading-[1.15] tracking-tight">
              Know{" "}
              <span className="text-accent">why</span> you got it wrong
            </h1>
            <p className="mb-7 text-base leading-relaxed text-muted-foreground">
              Upload a lecture PDF or PowerPoint, take a quiz, and get each wrong
              answer explained against the line of your own document that settles it.
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

          {/*
            Stacked rather than beside the copy. In a two-column split the tile
            got 468px of a 1200px capture, putting its body text at about 5px.
            Full width it renders near the size it was captured at, so the
            reasoning is readable, which is the only reason to show it.

            Two assets, each captured for the width it renders at. The wide tile
            at 992px becomes 0.35 scale under 640px, where its text is
            decorative rather than legible, so phones get their own capture.
          */}
          <figure className="hidden w-full sm:block">
            <Image
              src="/results-tile-stacked.png"
              alt="A wrong multiple-choice answer, the correct answer beside it, and an explanation of why the choice was wrong"
              width={992}
              height={351}
              sizes="(max-width: 1048px) 100vw, 992px"
              className="h-auto w-full rounded-xl border border-border shadow-sm"
            />
            <figcaption className="mt-2 text-xs text-muted-foreground">
              Every wrong answer comes with the reasoning and the line of your
              document it came from.
            </figcaption>
          </figure>

          <figure className="w-full sm:hidden">
            <Image
              src="/results-tile-mobile.png"
              alt="A wrong multiple-choice answer, the correct answer beside it, and an explanation of why the choice was wrong"
              width={343}
              height={491}
              sizes="(max-width: 639px) 100vw, 0px"
              className="h-auto w-full rounded-xl border border-border shadow-sm"
            />
            <figcaption className="mt-2 text-xs text-muted-foreground">
              Every wrong answer comes with the reasoning.
            </figcaption>
          </figure>
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