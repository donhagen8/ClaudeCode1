import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { stirlingCompress } from "@/lib/stirling";
import { validatePdfMagicBytes } from "@/lib/tempfile";
import { checkRateLimit } from "@/lib/ratelimit";
import { logOperation } from "@/lib/usage";
import { createClient } from "@/lib/supabase/server";

const MAX_FREE_SIZE = 10 * 1024 * 1024;
const MAX_PAID_SIZE = 100 * 1024 * 1024;

const schema = z.object({
  level: z.enum(["low", "medium", "high"]).default("medium"),
});

export async function POST(req: NextRequest) {
  const start = Date.now();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";

  try {
    let userId: string | null = null;
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    } catch {
      // Supabase not configured — anonymous request
    }

    let allowed = true;
    try {
      const result = await checkRateLimit(userId, ip);
      allowed = result.allowed;
    } catch {
      // Rate limit check failed (Supabase not configured) — allow in dev
    }

    if (!allowed) {
      return NextResponse.json(
        { error: "Daily limit reached. Upgrade for unlimited access.", code: "RATE_LIMITED" },
        { status: 429 }
      );
    }

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json(
        { error: "Invalid request format.", code: "INVALID_REQUEST" },
        { status: 400 }
      );
    }

    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json(
        { error: "Please upload a PDF file.", code: "INVALID_INPUT" },
        { status: 400 }
      );
    }

    const parsed = schema.safeParse({ level: formData.get("level") });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid compression level.", code: "INVALID_INPUT" },
        { status: 400 }
      );
    }
    const { level } = parsed.data;

    const maxSize = userId ? MAX_PAID_SIZE : MAX_FREE_SIZE;
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: `File size exceeds ${userId ? "100MB" : "10MB"} limit.`,
          code: "FILE_TOO_LARGE",
        },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!validatePdfMagicBytes(buffer)) {
      return NextResponse.json(
        { error: "File does not appear to be a valid PDF.", code: "INVALID_PDF" },
        { status: 400 }
      );
    }

    const compressed = await stirlingCompress(buffer, level);

    try {
      await logOperation({
        userId,
        ip,
        operation: `compress_${level}`,
        fileSizeBytes: file.size,
        durationMs: Date.now() - start,
      });
    } catch {
      // Log failure is non-fatal
    }

    return new NextResponse(new Uint8Array(compressed), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="compressed.pdf"',
        "Content-Length": String(compressed.length),
      },
    });
  } catch (err) {
    console.error("[compress] processing error:", err);
    return NextResponse.json(
      { error: "PDF processing failed. Please try again.", code: "PROCESSING_ERROR" },
      { status: 500 }
    );
  }
}
