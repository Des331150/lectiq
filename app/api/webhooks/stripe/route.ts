import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature")!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as any;
      const userId = session.client_reference_id || session.metadata?.userId;
      const customerId = session.customer as string;
      if (userId) {
        await supabase.from("users").upsert({
          id: userId,
          stripe_customer_id: customerId,
          subscription_status: "pro",
        });
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as any;
      const customerId = subscription.customer as string;
      const { data: users } = await supabase
        .from("users")
        .select("id")
        .eq("stripe_customer_id", customerId);
      if (users && users.length > 0) {
        const isActive = subscription.status === "active" || subscription.status === "trialing";
        await supabase
          .from("users")
          .update({ subscription_status: isActive ? "pro" : "free" })
          .eq("stripe_customer_id", customerId);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
