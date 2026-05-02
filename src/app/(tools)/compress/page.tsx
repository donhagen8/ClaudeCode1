"use client";

import { useState } from "react";
import DropZone from "@/components/DropZone";

type Level = "low" | "medium" | "high";

export default function CompressPage() {
  const [level, setLevel] = useState<Level>("medium");

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "48px 24px" }}>
      <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "8px" }}>Compress PDF</h1>
      <p style={{ color: "#8892a4", marginBottom: "32px" }}>
        Reduce file size while preserving readability.
      </p>

      <div style={{ display: "flex", gap: "12px", marginBottom: "32px" }}>
        {(["low", "medium", "high"] as Level[]).map((l) => (
          <button
            key={l}
            onClick={() => setLevel(l)}
            style={{
              padding: "8px 20px",
              borderRadius: "6px",
              border: `1px solid ${level === l ? "#00b894" : "#2d3447"}`,
              backgroundColor: level === l ? "rgba(0,184,148,0.1)" : "transparent",
              color: level === l ? "#00b894" : "#8892a4",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 500,
              textTransform: "capitalize",
            }}
          >
            {l}
          </button>
        ))}
      </div>

      <DropZone
        endpoint="/api/process/compress"
        multiple={false}
        extraFields={{ level }}
        downloadName="compressed.pdf"
        label="Drop a PDF here"
        sublabel="or click to browse"
      />
    </div>
  );
}
