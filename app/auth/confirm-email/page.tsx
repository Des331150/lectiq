import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";

/**
 * "Check your inbox", as its own screen.
 *
 * Signup used to redirect to `/auth/login?registered=true`, a param the login
 * page never read, so someone who had just created an account landed on a bare
 * sign-in form with nothing explaining why they were still signed out.
 */
export default function ConfirmEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <MailCheck className="mx-auto h-8 w-8 text-accent" aria-hidden="true" />
          <CardTitle className="text-2xl font-bold">Check your inbox</CardTitle>
          <CardDescription>
            We sent a confirmation link to your email. Open it to finish setting up
            your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The link expires after a while. If it does, you can request another from
            the sign-in page.
          </p>
          <LinkButton href="/auth/login" className="w-full">
            Back to sign in
          </LinkButton>
          <p className="text-sm text-muted-foreground">
            Wrong address?{" "}
            <Link
              href="/auth/register"
              className="underline underline-offset-4 hover:text-primary"
            >
              Sign up again
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}