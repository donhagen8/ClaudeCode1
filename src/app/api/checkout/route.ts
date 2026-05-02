import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  priceId: z.string().min(1),
  tier: z.enum(["founding", "earlybird", "pro_monthly", "pro_yearly"]),
});

async function getSlotsRemaining(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  tier: string
): Promise<number> {
  if (tier !== "founding" && tier !== "earlybird") return Infinity;

  const prefix = tier === "founding" ? "founding" : "earlybird";
  const [{ data: used }, { data: total }] = await Promise.all([
    supabase.from("config").select("value").eq("key", `${prefix}_slots_used`).single(),
    supabase.from("config").select("value").eq("key", `${prefix}_slots_total`).single(),
  ]);

  if (!used || !total) return 0;
  return parseInt(total.value, 10) - parseInt(used.value, 10);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body.", code: "INVALID_REQUEST" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid parameters.", code: "INVALID_INPUT" }, { status: 400 });
  }

  const { priceId, tier } = parsed.data;

  const serviceSupabase = await createServiceClient();

  if (tier === "founding" || tier === "earlybird") {
    const remaining = await getSlotsRemaining(serviceSupabase, tier);
    if (remaining <= 0) {
      return NextResponse.json(
        { error: "This tier is no longer available.", code: "TIER_SOLD_OUT" },
        { status: 409 }
      );
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await getStripe().checkout.sessions.create({
    mode: tier === "founding" || tier === "earlybird" ? "payment" : "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard?checkout=success`,
    cancel_url: `${appUrl}/pricing?checkout=cancelled`,
    customer_email: user?.email,
    metadata: {
      tier,
      userId: user?.id ?? "",
    },
  });

  return NextResponse.json({ url: session.url });
}
