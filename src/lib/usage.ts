import { createServiceClient } from "@/lib/supabase/server";

export async function logOperation(params: {
  userId: string | null;
  ip: string;
  operation: string;
  fileSizeBytes: number;
  durationMs: number;
}) {
  const supabase = await createServiceClient();
  await supabase.from("usage_log").insert({
    user_id: params.userId,
    ip_address: params.ip,
    operation: params.operation,
    file_size_bytes: params.fileSizeBytes,
    duration_ms: params.durationMs,
  });
}
