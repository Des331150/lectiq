import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function BillingPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  const isPro = userData?.subscription_status === "pro";

  return (
    <div className="min-h-screen p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-8">Billing</h1>

      <div className="grid grid-cols-2 gap-6">
        <div className={`rounded-lg border p-6 ${isPro ? "opacity-60" : "ring-2 ring-primary"}`}>
          <h2 className="text-lg font-bold mb-2">Free</h2>
          <p className="text-3xl font-bold mb-4">$0</p>
          <ul className="space-y-2 mb-6">
            <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-green-600" /> 3 documents</li>
            <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-green-600" /> 5 quizzes / month</li>
            <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-green-600" /> MCQ + Free Response</li>
          </ul>
          <p className="text-sm text-muted-foreground text-center">Current plan</p>
        </div>

        <div className={`rounded-lg border p-6 ${isPro ? "ring-2 ring-primary" : ""}`}>
          <h2 className="text-lg font-bold mb-2">Pro</h2>
          <p className="text-3xl font-bold mb-4">$TBD</p>
          <ul className="space-y-2 mb-6">
            <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-green-600" /> Unlimited documents</li>
            <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-green-600" /> Unlimited quizzes</li>
            <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-green-600" /> AI-graded free response</li>
          </ul>
          <p className="text-sm text-muted-foreground text-center">{isPro ? "Current plan" : "Set up Stripe to enable"}</p>
        </div>
      </div>
    </div>
  );
}
