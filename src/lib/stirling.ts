const STIRLING_URL = process.env.STIRLING_PDF_URL ?? "http://localhost:8080";

export async function stirlingMerge(files: Buffer[]): Promise<Buffer> {
  const form = new FormData();
  files.forEach((file, i) => {
    form.append("files", new Blob([new Uint8Array(file)], { type: "application/pdf" }), `file-${i}.pdf`);
  });
  form.append("sortFilesBeforeAdding", "false");

  const res = await fetch(`${STIRLING_URL}/api/v1/general/merge-pdfs`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Stirling merge failed: ${err}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

export async function stirlingCompress(
  file: Buffer,
  level: "low" | "medium" | "high"
): Promise<Buffer> {
  const qualityMap = { low: 3, medium: 2, high: 1 };
  const form = new FormData();
  form.append("fileInput", new Blob([new Uint8Array(file)], { type: "application/pdf" }), "input.pdf");
  form.append("optimizeLevel", String(qualityMap[level]));

  const res = await fetch(`${STIRLING_URL}/api/v1/general/compress-pdf`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) throw new Error(`Stirling compress failed`);
  return Buffer.from(await res.arrayBuffer());
}

export async function stirlingSplit(
  file: Buffer,
  pages: string
): Promise<Buffer> {
  const form = new FormData();
  form.append("fileInput", new Blob([new Uint8Array(file)], { type: "application/pdf" }), "input.pdf");
  form.append("pageNumbers", pages);

  const res = await fetch(`${STIRLING_URL}/api/v1/general/split-pages`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) throw new Error(`Stirling split failed`);
  return Buffer.from(await res.arrayBuffer());
}

export async function stirlingConvert(
  file: Buffer,
  fromType: string,
  toType: string
): Promise<Buffer> {
  const endpointMap: Record<string, string> = {
    "pdf-to-word": "/api/v1/convert/pdf/word",
    "pdf-to-excel": "/api/v1/convert/pdf/excel",
    "pdf-to-jpg": "/api/v1/convert/pdf/img",
    "word-to-pdf": "/api/v1/convert/word/pdf",
    "excel-to-pdf": "/api/v1/convert/excel/pdf",
    "jpg-to-pdf": "/api/v1/convert/img/pdf",
  };

  const key = `${fromType}-to-${toType}`;
  const endpoint = endpointMap[key];
  if (!endpoint) throw new Error(`Unsupported conversion: ${key}`);

  const mimeMap: Record<string, string> = {
    pdf: "application/pdf",
    word: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    excel: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    jpg: "image/jpeg",
  };

  const form = new FormData();
  form.append(
    "fileInput",
    new Blob([new Uint8Array(file)], { type: mimeMap[fromType] ?? "application/octet-stream" }),
    `input.${fromType}`
  );

  const res = await fetch(`${STIRLING_URL}${endpoint}`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) throw new Error(`Stirling convert failed`);
  return Buffer.from(await res.arrayBuffer());
}
