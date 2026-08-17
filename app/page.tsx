import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border">
        <div className="text-lg font-bold tracking-tight">Lectiq</div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/auth/login">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Link href="/auth/register">
            <Button size="sm" className="font-medium">Get Started</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <div className="flex flex-col md:flex-row gap-10 items-center px-4 sm:px-6 py-12 sm:py-16 max-w-5xl mx-auto">
          <div className="flex-1">
            <h1 className="text-[clamp(2rem,5vw,3.25rem)] font-bold leading-[1.15] tracking-tight text-balance mb-4">
              Turn your lecture notes<br className="hidden sm:inline" />
              <span className="text-accent">into quizzes</span>
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground max-w-[65ch] mb-4">
              The lectures you already have → quizzes that actually test
              understanding, not just recognition.
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground max-w-[65ch] mb-7">
              No generic question banks. Lectiq builds practice quizzes from your
              lecture PDFs and slides using active recall — the study method with
              the strongest evidence for long-term retention.
            </p>
            <div className="flex flex-wrap gap-2.5">
              <Link href="/auth/register">
                <Button size="lg" className="font-medium">Start Studying</Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="outline" size="lg" className="font-medium">Sign In</Button>
              </Link>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Built on active recall — the study method proven by decades of cognitive science research.
            </p>
          </div>
          <div className="flex-1 w-full">
            <Image
              src="/dashboard-screenshot.png"
              alt="Lectiq dashboard"
              width={1200}
              height={800}
              sizes="(max-width: 768px) 100vw, 50vw"
              className="rounded-xl border border-border w-full h-auto shadow-sm"
            />
          </div>
        </div>

        <div className="border-t border-border py-12 px-4 sm:px-6">
          <h2 className="text-center text-xs font-medium uppercase tracking-[1.5px] text-accent mb-8">
            How it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              { num: "1", title: "Upload", desc: "Drop your PDF or PowerPoint. We extract the key topics automatically." },
              { num: "2", title: "Generate", desc: "Pick the topics you want to study. Choose MCQ, free response, or both." },
              { num: "3", title: "Learn", desc: "Take the quiz, get AI-graded feedback, and track your progress." },
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-base mx-auto mb-3">
                  {step.num}
                </div>
                <h3 className="font-semibold text-base mb-1.5">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-[240px] mx-auto">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border py-12 px-4 sm:px-6">
          <h2 className="text-center text-xs font-medium uppercase tracking-[1.5px] text-accent mb-8">
            FAQ
          </h2>
          <div className="max-w-2xl mx-auto space-y-6">
            {[
              {
                q: "How does the AI grading work?",
                a: "Free-response answers are scored against your lecture material, not a fixed answer key. You get feedback on what you missed and why — like a tutor who actually read your notes.",
              },
              {
                q: "What file types can I upload?",
                a: "PDF and PowerPoint. Your slides, your lecture notes, your readings — we handle the rest.",
              },
              {
                q: "How is Lectiq different from Quizlet or Anki?",
                a: "Those tools test recognition. Lectiq tests understanding. You can't guess your way through a free-response question, and our AI grades it against your actual material.",
              },
            ].map((faq) => (
              <div key={faq.q}>
                <h3 className="font-semibold text-base mb-1">{faq.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border py-12 px-4 sm:px-6 text-center">
          <h2 className="text-xl font-bold mb-2">Ready to study smarter?</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Stop re-reading. Start recalling.
          </p>
          <Link href="/auth/register">
            <Button size="lg" className="font-medium">Start Studying</Button>
          </Link>
        </div>
      </main>

      <footer className="py-5 px-4 sm:px-6 text-center text-sm text-muted-foreground border-t border-border">
        <div className="flex items-center justify-center gap-4 mb-1">
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
        </div>
        <p>Lectiq — Study smarter</p>
      </footer>
    </div>
  );
}
