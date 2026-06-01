import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b">
        <div className="text-xl font-bold">Lectiq</div>
        <div className="flex items-center gap-4">
          <Link href="/auth/login">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link href="/auth/register">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
          Turn your lecture notes into quizzes
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-xl">
          Upload your PDFs and slides. Lectiq extracts the topics and generates
          custom quiz questions — MCQ or free response — so you can study smarter.
        </p>
        <div className="flex gap-4">
          <Link href="/auth/register">
            <Button size="lg">Start Studying Free</Button>
          </Link>
          <Link href="/auth/login">
            <Button variant="outline" size="lg">Sign In</Button>
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-8 mt-16 text-left">
          <div>
            <h3 className="font-semibold mb-2">Upload</h3>
            <p className="text-sm text-muted-foreground">
              Drop your PDF or PowerPoint. We extract the key topics automatically.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Generate</h3>
            <p className="text-sm text-muted-foreground">
              Pick the topics you want to study. Choose MCQ, free response, or both.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Learn</h3>
            <p className="text-sm text-muted-foreground">
              Take the quiz, get AI-graded feedback, and track your progress.
            </p>
          </div>
        </div>
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        Lectiq &mdash; Study smarter
      </footer>
    </div>
  );
}
