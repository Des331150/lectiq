import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-02-24" as any,
      typescript: true,
    });
  }
  return _stripe;
}

export const BASIC_PRICE_ID_MONTHLY = "price_basic_monthly";
export const BASIC_PRICE_ID_YEARLY = "price_basic_yearly";
export const PRO_PRICE_ID_MONTHLY = "price_pro_monthly";
export const PRO_PRICE_ID_YEARLY = "price_pro_yearly";

const PRICE_IDS: Record<string, Record<string, string>> = {
  basic: { monthly: BASIC_PRICE_ID_MONTHLY, yearly: BASIC_PRICE_ID_YEARLY },
  pro: { monthly: PRO_PRICE_ID_MONTHLY, yearly: PRO_PRICE_ID_YEARLY },
};

export function getPriceId(plan: "basic" | "pro", interval: "monthly" | "yearly"): string {
  return PRICE_IDS[plan][interval];
}

export async function createCheckoutSession(
  userId: string,
  userEmail: string,
  plan: "basic" | "pro",
  interval: "monthly" | "yearly" = "monthly"
) {
  const priceId = getPriceId(plan, interval);
  return await getStripe().checkout.sessions.create({
    mode: "subscription",
    customer_email: userEmail,
    client_reference_id: userId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=true`,
    metadata: { userId, plan },
  });
}

export async function createPortalSession(customerId: string) {
  return await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
  });
}
