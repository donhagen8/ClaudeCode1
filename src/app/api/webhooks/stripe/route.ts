import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";
import type Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature.", code: "NO_SIGNATURE" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("[stripe-webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Webhook verification failed.", code: "INVALID_SIGNATURE" }, { status: 400 });
  }

  const supabase = await createServiceClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { tier, userId } = session.metadata ?? {};

    if (!userId || !tier) {
      console.error("[stripe-webhook] missing metadata:", session.metadata);
      return NextResponse.json({ received: true });
    }

    const tierExpiresAt =
      tier === "earlybird"
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        : null;

    const mappedTier =
      tier === "founding" ? "founding"
      : tier === "earlybird" ? "earlybird"
      : "pro";

    await supabase
      .from("profiles")
      .upsert({
        id: userId,
        tier: mappedTier,
        tier_expires_at: tierExpiresAt,
        stripe_customer_id: session.customer as string,
      });

    if (tier === "founding" || tier === "earlybird") {
      const prefix = tier === "founding" ? "founding" : "earlybird";
      const { data } = await supabase
        .from("config")
        .select("value")
        .eq("key", `${prefix}_slots_used`)
        .single();

      if (data) {
        await supabase
          .from("config")
          .update({ value: String(parseInt(data.value, 10) + 1) })
          .eq("key", `${prefix}_slots_used`);
      }
    }
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const userId = sub.metadata?.userId;
    if (!userId) return NextResponse.json({ received: true });

    const isActive = sub.status === "active";
    await supabase
      .from("profiles")
      .update({
        tier: isActive ? "pro" : "free",
        stripe_subscription_id: isActive ? sub.id : null,
      })
      .eq("id", userId);
  }

  return NextResponse.json({ received: true });
}
