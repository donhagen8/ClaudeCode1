"use client";

import { useState, useCallback, useRef } from "react";

interface DropZoneProps {
  endpoint: string;
  accept?: string;
  multiple?: boolean;
  extraFields?: Record<string, string>;
  downloadName?: string;
  label?: string;
  sublabel?: string;
  maxFreeBytes?: number;
}

interface UploadedFile {
  file: File;
  id: string;
}

type Status = "idle" | "processing" | "done" | "error";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DropZone({
  endpoint,
  accept = "application/pdf",
  multiple = false,
  extraFields = {},
  downloadName = "output.pdf",
  label = "Drop PDF files here",
  sublabel = "or click to browse",
  maxFreeBytes = 10 * 1024 * 1024,
}: DropZoneProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const arr = Array.from(incoming);
    const pdfs = arr.filter((f) =>
      accept.split(",").some((a) => a.trim() === f.type || a.trim() === "*")
    );
    const newEntries: UploadedFile[] = pdfs.map((f) => ({
      file: f,
      id: `${f.name}-${f.size}-${Math.random()}`,
    }));
    setFiles((prev) => (multiple ? [...prev, ...newEntries] : newEntries));
    setStatus("idle");
    setError(null);
  }, [accept, multiple]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const onDragLeave = useCallback(() => setDragging(false), []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) addFiles(e.target.files);
    },
    [addFiles]
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const totalBytes = files.reduce((s, f) => s + f.file.size, 0);
  const oversized = totalBytes > maxFreeBytes;

  const handleSubmit = useCallback(async () => {
    if (files.length === 0) return;

    if (oversized) {
      setError(`Total size exceeds 10 MB. Upgrade for up to 100 MB.`);
      return;
    }

    setStatus("processing");
    setError(null);

    const form = new FormData();
    files.forEach((f) => form.append(multiple ? "files" : "file", f.file));
    Object.entries(extraFields).forEach(([k, v]) => form.append(k, v));

    try {
      const res = await fetch(endpoint, { method: "POST", body: form });

      if (!res.ok) {
        const json = await res.json().catch(() => ({ error: "Processing failed." }));
        throw new Error(json.error ?? "Processing failed.");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setStatus("done");
      setFiles([]);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }, [files, oversized, endpoint, multiple, extraFields, downloadName]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `1px ${dragging ? "solid" : "dashed"} ${dragging ? "#00b894" : "#2d3447"}`,
          borderRadius: "12px",
          padding: "48px 32px",
          textAlign: "center",
          cursor: "pointer",
          backgroundColor: dragging ? "rgba(0,184,148,0.05)" : "rgba(45,52,71,0.3)",
          transition: "border-color 0.15s, background-color 0.15s",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={onInputChange}
          style={{ display: "none" }}
        />
        <div style={{ fontSize: "40px", marginBottom: "12px" }}>📄</div>
        <p style={{ color: "#f0f0f0", fontSize: "18px", fontWeight: 600, margin: "0 0 4px" }}>
          {label}
        </p>
        <p style={{ color: "#8892a4", fontSize: "14px", margin: 0 }}>{sublabel}</p>
      </div>

      {files.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, marginTop: "16px" }}>
          {files.map((f) => (
            <li
              key={f.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                marginBottom: "8px",
                backgroundColor: "rgba(45,52,71,0.5)",
                borderRadius: "8px",
              }}
            >
              <div>
                <span style={{ color: "#f0f0f0", fontSize: "14px" }}>{f.file.name}</span>
                <span style={{ color: "#8892a4", fontSize: "12px", marginLeft: "8px" }}>
                  {formatBytes(f.file.size)}
                </span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#8892a4",
                  cursor: "pointer",
                  fontSize: "18px",
                  lineHeight: 1,
                  padding: "0 4px",
                }}
                aria-label="Remove file"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {oversized && (
        <p style={{ color: "#e17055", fontSize: "14px", marginTop: "12px" }}>
          Total size {formatBytes(totalBytes)} exceeds the 10 MB free limit.{" "}
          <a href="/pricing" style={{ color: "#00b894", textDecoration: "underline" }}>
            Upgrade
          </a>{" "}
          for up to 100 MB.
        </p>
      )}

      {files.length > 0 && (
        <button
          onClick={handleSubmit}
          disabled={status === "processing"}
          style={{
            display: "block",
            width: "100%",
            marginTop: "20px",
            padding: "14px",
            backgroundColor: status === "processing" ? "#007a60" : "#00b894",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: 600,
            cursor: status === "processing" ? "not-allowed" : "pointer",
            transition: "background-color 0.15s",
          }}
        >
          {status === "processing" ? "Processing…" : "Process & Download"}
        </button>
      )}

      {status === "done" && (
        <p style={{ color: "#00b894", fontSize: "14px", marginTop: "12px", textAlign: "center" }}>
          Done! Your file downloaded automatically.
        </p>
      )}

      {status === "error" && error && (
        <p style={{ color: "#e17055", fontSize: "14px", marginTop: "12px", textAlign: "center" }}>
          {error}
        </p>
      )}
    </div>
  );
}
