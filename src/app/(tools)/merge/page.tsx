import DropZone from "@/components/DropZone";

export default function MergePage() {
  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "48px 24px" }}>
      <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "8px" }}>Merge PDFs</h1>
      <p style={{ color: "#8892a4", marginBottom: "32px" }}>
        Upload 2 or more PDF files. They will be merged in the order listed.
      </p>
      <DropZone
        endpoint="/api/process/merge"
        multiple={true}
        downloadName="merged.pdf"
        label="Drop PDF files here"
        sublabel="or click to browse"
      />
    </div>
  );
}
