import DropZone from "@/components/DropZone";
import ToolCard from "@/components/ToolCard";

const tools = [
  { label: "Compress PDF", description: "Shrink file size — low, medium, or high quality", href: "/compress", icon: "🗜️" },
  { label: "Split PDF", description: "Extract pages or split by range", href: "/split", icon: "✂️" },
  { label: "PDF → Word", description: "Convert to editable .docx", href: "/pdf-to-word", icon: "📝" },
  { label: "PDF → Excel", description: "Extract tables to .xlsx", href: "/pdf-to-excel", icon: "📊" },
  { label: "PDF → JPG", description: "Export each page as an image", href: "/pdf-to-jpg", icon: "🖼️" },
  { label: "Word → PDF", description: "Convert .docx to PDF", href: "/word-to-pdf", icon: "📄" },
  { label: "Rotate Pages", description: "Fix orientation in a click", href: "/rotate", icon: "🔄" },
  { label: "Protect PDF", description: "Add or remove a password", href: "/protect", icon: "🔒" },
];

export default function HomePage() {
  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", padding: "48px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: "48px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: 700, margin: "0 0 12px", color: "#f0f0f0" }}>
          Merge PDFs
        </h1>
        <p style={{ color: "#8892a4", fontSize: "16px", margin: "0 0 8px" }}>
          Drop 2 or more PDF files below. They'll be merged and downloaded instantly.
        </p>
        <p style={{ color: "#4a5568", fontSize: "13px", margin: 0 }}>
          Files are processed and deleted immediately. We never store your documents.
        </p>
      </div>

      <DropZone
        endpoint="/api/process/merge"
        multiple={true}
        downloadName="merged.pdf"
        label="Drop PDF files here"
        sublabel="or click to browse — 10 MB limit for free, 100 MB after upgrade"
      />

      <div style={{ marginTop: "72px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#8892a4", marginBottom: "24px" }}>
          More tools
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "16px",
          }}
        >
          {tools.map((t) => (
            <ToolCard key={t.href} {...t} />
          ))}
        </div>
      </div>

      <footer style={{ marginTop: "72px", textAlign: "center" }}>
        <p style={{ color: "#4a5568", fontSize: "13px" }}>
          PDF Pro processes files in memory and deletes them immediately after download.{" "}
          <a href="/pricing" style={{ color: "#00b894", textDecoration: "none" }}>
            See pricing →
          </a>
        </p>
      </footer>
    </div>
  );
}
