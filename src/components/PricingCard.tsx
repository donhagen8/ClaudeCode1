"use client";

interface PricingCardProps {
  title: string;
  price: string;
  period: string;
  features: string[];
  ctaLabel: string;
  priceId: string;
  tier: string;
  soldOut?: boolean;
  highlight?: boolean;
  slotsRemaining?: number;
}

export default function PricingCard({
  title,
  price,
  period,
  features,
  ctaLabel,
  priceId,
  tier,
  soldOut = false,
  highlight = false,
  slotsRemaining,
}: PricingCardProps) {
  async function handleClick() {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId, tier }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  return (
    <div
      style={{
        backgroundColor: highlight ? "rgba(0,184,148,0.08)" : "rgba(45,52,71,0.4)",
        border: `1px solid ${highlight ? "#00b894" : "#2d3447"}`,
        borderRadius: "12px",
        padding: "32px 28px",
        display: "flex",
        flexDirection: "column",
        opacity: soldOut ? 0.55 : 1,
      }}
    >
      <h3 style={{ color: "#f0f0f0", margin: "0 0 4px", fontSize: "18px", fontWeight: 700 }}>
        {title}
      </h3>

      {slotsRemaining !== undefined && slotsRemaining > 0 && (
        <p style={{ color: "#00b894", fontSize: "12px", margin: "0 0 16px" }}>
          {slotsRemaining} spot{slotsRemaining !== 1 ? "s" : ""} left
        </p>
      )}
      {soldOut && (
        <p style={{ color: "#8892a4", fontSize: "12px", margin: "0 0 16px" }}>Sold out</p>
      )}
      {slotsRemaining === undefined && !soldOut && (
        <div style={{ marginBottom: "16px" }} />
      )}

      <div style={{ marginBottom: "24px" }}>
        <span style={{ color: "#f0f0f0", fontSize: "36px", fontWeight: 700 }}>{price}</span>
        <span style={{ color: "#8892a4", fontSize: "14px", marginLeft: "4px" }}>{period}</span>
      </div>

      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", flexGrow: 1 }}>
        {features.map((f) => (
          <li key={f} style={{ color: "#8892a4", fontSize: "14px", marginBottom: "10px", display: "flex", gap: "8px" }}>
            <span style={{ color: "#00b894", flexShrink: 0 }}>✓</span>
            {f}
          </li>
        ))}
      </ul>

      <button
        onClick={handleClick}
        disabled={soldOut}
        style={{
          backgroundColor: soldOut ? "#2d3447" : highlight ? "#00b894" : "transparent",
          color: soldOut ? "#8892a4" : "#fff",
          border: soldOut ? "none" : `1px solid ${highlight ? "#00b894" : "#2d3447"}`,
          borderRadius: "8px",
          padding: "12px",
          fontSize: "15px",
          fontWeight: 600,
          cursor: soldOut ? "not-allowed" : "pointer",
          width: "100%",
        }}
      >
        {soldOut ? "Sold out" : ctaLabel}
      </button>
    </div>
  );
}
