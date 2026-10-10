import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/ui/link-button";

export default async function NotFound() {
  // A signed-in user who hits a 404 was almost certainly aiming at a study
  // screen, not the marketing page. Sending them to the landing page loses them
  // out of the product entirely, so the actions change with the session.
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="mb-4 text-6xl font-bold text-primary">404</h1>
      <p className="mb-8 max-w-sm text-lg text-muted-foreground">
        {user
          ? "We couldn't find that page. It may have been deleted."
          : "The page you're looking for doesn't exist."}
      </p>
      {user ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          <LinkButton href="/dashboard">Back to dashboard</LinkButton>
          <LinkButton href="/history" variant="outline">
            See your quiz history
          </LinkButton>
        </div>
      ) : (
        <LinkButton href="/">Go home</LinkButton>
      )}
      {!user && (
        <p className="mt-6 text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-primary underline underline-offset-4">
            Sign in
          </Link>
        </p>
      )}
    </div>
  );
}