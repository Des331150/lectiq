import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between px-7 py-4 border-b border-border">
        <div className="text-lg font-bold tracking-tight">Lectiq</div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login">
            <Button variant="ghost" className="text-sm">Sign In</Button>
          </Link>
          <Link href="/auth/register">
            <Button className="text-sm font-medium">Get Started</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <div className="flex flex-col md:flex-row gap-10 items-center px-7 py-16 max-w-5xl mx-auto">
          <div className="flex-1">
            <h1 className="text-[clamp(2rem,5vw,3.25rem)] font-bold leading-[1.15] tracking-tight text-balance mb-4">
              Turn your lecture notes<br />
              <span className="text-[hsl(var(--accent))]">into quizzes</span>
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground max-w-[65ch] mb-7">
              Upload your PDFs and slides. Lectiq extracts the topics and generates
              custom quiz questions — so you can study smarter, not longer.
            </p>
            <div className="flex gap-2.5">
              <Link href="/auth/register">
                <Button size="lg" className="text-sm font-medium px-6 py-3 h-auto">Start Studying Free</Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="outline" size="lg" className="text-sm font-medium px-6 py-3 h-auto">Sign In</Button>
              </Link>
            </div>
          </div>
          <div className="flex-1 w-full">
            <div className="rounded-xl bg-card border border-border h-[220px] flex items-center justify-center text-sm text-muted-foreground border-dashed">
              App Screenshot
            </div>
          </div>
        </div>

        <div className="border-t border-border py-12 px-7">
          <p className="text-center text-xs font-medium uppercase tracking-[1.5px] text-[hsl(var(--accent))] mb-8">
            How it works
          </p>
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
      </main>

      <footer className="py-5 text-center text-sm text-muted-foreground border-t border-border">
        Lectiq — Study smarter
      </footer>
    </div>
  );
}
