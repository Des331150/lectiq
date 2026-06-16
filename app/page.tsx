import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
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
          <h2 className="text-center text-xs font-medium uppercase tracking-[1.5px] text-accent mb-2">
            Pricing
          </h2>
          <p className="text-center text-muted-foreground text-sm mb-8">
            Start with Basic. Upgrade when you need more.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Basic card */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="text-lg font-bold mb-1">Basic</h3>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-4">
                For getting started
              </p>
              <div className="mb-4">
                <span className="text-3xl font-bold">$7.99</span>
                <span className="text-sm text-muted-foreground ml-1">/month</span>
                <div className="text-xs text-muted-foreground">or $69.99 /year <span className="text-green-700 font-medium">Save 27%</span></div>
              </div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600 shrink-0" />
                  10 quizzes per month
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600 shrink-0" />
                  MCQ + Free Response
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600 shrink-0" />
                  AI-graded feedback
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600 shrink-0" />
                  PDF export
                </li>
              </ul>
              <Link href="/auth/register">
                <Button className="w-full font-medium">Get Basic</Button>
              </Link>
            </div>

            {/* Pro card */}
            <div className="rounded-lg border border-border bg-card p-6 relative ring-2 ring-primary">
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs font-medium uppercase tracking-wide bg-accent text-accent-foreground px-3 py-0.5 rounded-full">
                Popular
              </span>
              <h3 className="text-lg font-bold mb-1">Pro</h3>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-4">
                For power learners
              </p>
              <div className="mb-4">
                <span className="text-3xl font-bold">$14.99</span>
                <span className="text-sm text-muted-foreground ml-1">/month</span>
                <div className="text-xs text-muted-foreground">or $129.99 /year <span className="text-green-700 font-medium">Save 28%</span></div>
              </div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600 shrink-0" />
                  Unlimited quizzes (fair use)
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600 shrink-0" />
                  MCQ + Free Response
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600 shrink-0" />
                  AI-graded feedback
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600 shrink-0" />
                  All export formats (coming)
                </li>
              </ul>
              <Link href="/auth/register">
                <Button variant="outline" className="w-full font-medium">Go Pro</Button>
              </Link>
            </div>
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
              {
                q: "Can I export my quizzes?",
                a: "Basic plan includes PDF export. Pro subscribers get additional export formats as we roll them out.",
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
            <Button size="lg" className="font-medium">Get Basic — $7.99/mo</Button>
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
