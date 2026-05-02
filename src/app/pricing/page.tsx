import { createServiceClient } from "@/lib/supabase/server";
import PricingCard from "@/components/PricingCard";

async function getSlotCounts() {
  try {
    const supabase = await createServiceClient();
    const { data } = await supabase.from("config").select("key,value");
    if (!data) return { foundingUsed: 0, foundingTotal: 100, earlybirdUsed: 0, earlybirdTotal: 900 };

    const map = Object.fromEntries(data.map((r) => [r.key, parseInt(r.value, 10)]));
    return {
      foundingUsed: map["founding_slots_used"] ?? 0,
      foundingTotal: map["founding_slots_total"] ?? 100,
      earlybirdUsed: map["earlybird_slots_used"] ?? 0,
      earlybirdTotal: map["earlybird_slots_total"] ?? 900,
    };
  } catch {
    return { foundingUsed: 0, foundingTotal: 100, earlybirdUsed: 0, earlybirdTotal: 900 };
  }
}

export const revalidate = 30;

export default async function PricingPage() {
  const { foundingUsed, foundingTotal, earlybirdUsed, earlybirdTotal } = await getSlotCounts();

  const foundingRemaining = Math.max(0, foundingTotal - foundingUsed);
  const earlybirdRemaining = Math.max(0, earlybirdTotal - earlybirdUsed);

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", padding: "64px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: "56px" }}>
        <h1 style={{ fontSize: "36px", fontWeight: 700, margin: "0 0 16px" }}>
          Simple, honest pricing
        </h1>
        <p style={{ color: "#8892a4", fontSize: "16px", margin: "0 0 12px" }}>
          No Adobe. No subscriptions you forget about. Pay once or monthly — your call.
        </p>
        <p style={{ color: "#4a5568", fontSize: "14px" }}>
          🔒 No files are stored on our servers. Ever.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "24px",
          alignItems: "start",
        }}
      >
        <PricingCard
          title="Founding Member"
          price="$1"
          period="one-time, lifetime access"
          features={[
            "Lifetime access — pay once, done",
            "All current + future tools",
            "100 MB file limit",
            "500 operations per day",
            "Priority support",
          ]}
          ctaLabel="Claim founding spot"
          priceId={process.env.STRIPE_PRICE_FOUNDING ?? ""}
          tier="founding"
          soldOut={foundingRemaining <= 0}
          slotsRemaining={foundingRemaining > 0 ? foundingRemaining : undefined}
        />

        <PricingCard
          title="Early Bird"
          price="$5"
          period="for one full year"
          features={[
            "12 months of full access",
            "All current + future tools",
            "100 MB file limit",
            "500 operations per day",
            "Email support",
          ]}
          ctaLabel="Grab early bird deal"
          priceId={process.env.STRIPE_PRICE_EARLYBIRD ?? ""}
          tier="earlybird"
          soldOut={earlybirdRemaining <= 0}
          slotsRemaining={earlybirdRemaining > 0 ? earlybirdRemaining : undefined}
          highlight={foundingRemaining <= 0}
        />

        <PricingCard
          title="Pro"
          price="$5"
          period="/ month, or $48/year"
          features={[
            "Full access to all tools",
            "100 MB file limit",
            "500 operations per day",
            "Email support",
            "Cancel anytime",
          ]}
          ctaLabel="Start Pro"
          priceId={process.env.STRIPE_PRICE_MONTHLY ?? ""}
          tier="pro_monthly"
          highlight={foundingRemaining <= 0 && earlybirdRemaining <= 0}
        />
      </div>

      <div
        style={{
          marginTop: "64px",
          padding: "24px",
          backgroundColor: "rgba(45,52,71,0.4)",
          borderRadius: "12px",
          border: "1px solid #2d3447",
          textAlign: "center",
        }}
      >
        <h3 style={{ color: "#f0f0f0", margin: "0 0 12px", fontSize: "18px" }}>
          Free tier — no account required
        </h3>
        <p style={{ color: "#8892a4", margin: 0, fontSize: "14px" }}>
          3 operations per day · 10 MB file limit · All tools available
        </p>
      </div>
    </div>
  );
}
