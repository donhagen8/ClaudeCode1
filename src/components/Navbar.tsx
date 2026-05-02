import Link from "next/link";

const tools = [
  { label: "Merge", href: "/" },
  { label: "Compress", href: "/compress" },
  { label: "Split", href: "/split" },
  { label: "PDF → Word", href: "/pdf-to-word" },
  { label: "PDF → Excel", href: "/pdf-to-excel" },
  { label: "PDF → JPG", href: "/pdf-to-jpg" },
  { label: "Word → PDF", href: "/word-to-pdf" },
  { label: "Rotate", href: "/rotate" },
  { label: "Protect", href: "/protect" },
];

export default function Navbar() {
  return (
    <nav
      style={{
        backgroundColor: "#151929",
        borderBottom: "1px solid #2d3447",
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "56px",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <Link
        href="/"
        style={{
          color: "#00b894",
          fontWeight: 700,
          fontSize: "18px",
          textDecoration: "none",
          letterSpacing: "-0.5px",
        }}
      >
        PDF Pro
      </Link>

      <div style={{ display: "flex", gap: "4px", overflowX: "auto" }}>
        {tools.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            style={{
              color: "#8892a4",
              fontSize: "13px",
              padding: "6px 10px",
              borderRadius: "6px",
              textDecoration: "none",
              whiteSpace: "nowrap",
              transition: "color 0.15s, background-color 0.15s",
            }}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <Link
        href="/pricing"
        style={{
          backgroundColor: "#00b894",
          color: "#fff",
          padding: "7px 16px",
          borderRadius: "6px",
          fontSize: "13px",
          fontWeight: 600,
          textDecoration: "none",
          flexShrink: 0,
        }}
      >
        Upgrade
      </Link>
    </nav>
  );
}
