import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Check } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { createCheckoutSession } from "@/lib/stripe";
import { BillingToggle } from "@/components/billing-toggle";

export const dynamic = "force-dynamic";

export default async function BillingPage(props: {
  searchParams: Promise<{ interval?: string }>;
}) {
  const searchParams = await props.searchParams;
  const isYearly = searchParams.interval === "yearly";
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  const currentPlan = userData?.subscription_status || "basic";

  const plans = [
    {
      id: "basic",
      name: "Basic",
      monthly: { price: "$7.99", label: "/month" },
      yearly: { price: "$69.99", label: "/yr" },
      features: [
        "10 quizzes per month",
        "MCQ + Free Response questions",
        "AI-graded feedback",
        "PDF export",
      ],
    },
    {
      id: "pro",
      name: "Pro",
      monthly: { price: "$14.99", label: "/month" },
      yearly: { price: "$129.99", label: "/yr" },
      features: [
        "Unlimited quizzes (fair use)",
        "MCQ + Free Response questions",
        "AI-graded feedback",
        "All export formats (coming)",
      ],
      popular: true,
    },
  ];

  async function checkoutAction(formData: FormData) {
    "use server";
    const plan = formData.get("plan") as string;
    if (!user?.email) throw new Error("Not authenticated");
    const session = await createCheckoutSession(
      user.id,
      user.email,
      plan as "basic" | "pro",
      isYearly ? "yearly" : "monthly"
    );
    redirect(session.url!);
  }

  return (
    <AppShell title="Billing">
      <h1 className="text-2xl font-bold mb-2">Billing</h1>
      <p className="text-muted-foreground mb-8">Manage your subscription</p>

      <BillingToggle interval={isYearly ? "yearly" : "monthly"} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl">
        {plans.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const pricing = isYearly ? plan.yearly : plan.monthly;

          return (
            <div
              key={plan.id}
              className={`relative rounded-lg border p-6 ${
                isCurrent ? "ring-2 ring-primary" : ""
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs font-medium uppercase tracking-wide bg-accent text-accent-foreground px-3 py-0.5 rounded-full">
                  Popular
                </span>
              )}
              <h2 className="text-lg font-bold mb-1">{plan.name}</h2>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-4">
                {plan.id === "basic" ? "For getting started" : "For power learners"}
              </p>
              <div className="mb-4">
                <span className="text-3xl font-bold">{pricing.price}</span>
                <span className="text-sm text-muted-foreground ml-1">{pricing.label}</span>
                {isYearly && (
                  <span className="ml-2 text-xs text-green-700 font-medium">
                    Save {plan.id === "basic" ? "27" : "28"}%
                  </span>
                )}
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <p className="text-sm text-muted-foreground text-center pt-1">Current plan</p>
              ) : (
                <form action={checkoutAction}>
                  <input type="hidden" name="plan" value={plan.id} />
                  <button
                    type="submit"
                    className={`w-full rounded-lg py-2 text-sm font-medium text-center ${
                      plan.popular
                        ? "bg-primary text-primary-foreground"
                        : "border border-primary text-foreground"
                    }`}
                  >
                    {plan.id === "pro" ? "Go Pro" : "Get Basic"}
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
