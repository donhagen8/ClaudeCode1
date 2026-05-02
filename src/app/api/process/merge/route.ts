import { NextRequest, NextResponse } from "next/server";
import { stirlingMerge } from "@/lib/stirling";
import { validatePdfMagicBytes } from "@/lib/tempfile";
import { checkRateLimit } from "@/lib/ratelimit";
import { logOperation } from "@/lib/usage";
import { createClient } from "@/lib/supabase/server";

const MAX_FREE_SIZE = 10 * 1024 * 1024;
const MAX_PAID_SIZE = 100 * 1024 * 1024;

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

    const files = formData.getAll("files") as File[];

    if (!files || files.length < 2) {
      return NextResponse.json(
        { error: "Please upload at least 2 PDF files to merge.", code: "INVALID_INPUT" },
        { status: 400 }
      );
    }

    const maxSize = userId ? MAX_PAID_SIZE : MAX_FREE_SIZE;
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);

    if (totalSize > maxSize) {
      return NextResponse.json(
        {
          error: `Total file size exceeds ${userId ? "100MB" : "10MB"} limit.`,
          code: "FILE_TOO_LARGE",
        },
        { status: 413 }
      );
    }

    let buffers: Buffer[];
    try {
      buffers = await Promise.all(
        files.map(async (f) => {
          const buf = Buffer.from(await f.arrayBuffer());
          if (!validatePdfMagicBytes(buf)) {
            throw new Error(`One or more files does not appear to be a valid PDF.`);
          }
          return buf;
        })
      );
    } catch (err) {
      return NextResponse.json(
        {
          error: err instanceof Error ? err.message : "Invalid file format.",
          code: "INVALID_PDF",
        },
        { status: 400 }
      );
    }

    const merged = await stirlingMerge(buffers);

    try {
      await logOperation({
        userId,
        ip,
        operation: "merge",
        fileSizeBytes: totalSize,
        durationMs: Date.now() - start,
      });
    } catch {
      // Log failure is non-fatal
    }

    return new NextResponse(new Uint8Array(merged), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="merged.pdf"',
        "Content-Length": String(merged.length),
      },
    });
  } catch (err) {
    console.error("[merge] processing error:", err);
    return NextResponse.json(
      { error: "PDF processing failed. Please try again.", code: "PROCESSING_ERROR" },
      { status: 500 }
    );
  }
}
