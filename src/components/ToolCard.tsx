import Link from "next/link";

interface ToolCardProps {
  label: string;
  description: string;
  href: string;
  icon: string;
}

export default function ToolCard({ label, description, href, icon }: ToolCardProps) {
  return (
    <Link
      href={href}
      style={{
        display: "block",
        backgroundColor: "rgba(45,52,71,0.4)",
        border: "1px solid #2d3447",
        borderRadius: "10px",
        padding: "20px",
        textDecoration: "none",
        transition: "border-color 0.15s, background-color 0.15s",
      }}
    >
      <div style={{ fontSize: "28px", marginBottom: "10px" }}>{icon}</div>
      <p style={{ color: "#f0f0f0", fontWeight: 600, margin: "0 0 6px", fontSize: "15px" }}>
        {label}
      </p>
      <p style={{ color: "#8892a4", margin: 0, fontSize: "13px" }}>{description}</p>
    </Link>
  );
}
