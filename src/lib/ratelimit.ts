import { createServiceClient } from "@/lib/supabase/server";
import type { RateLimitResult } from "@/types";

const FREE_DAILY_LIMIT = 3;
const PAID_DAILY_LIMIT = 500;

export async function checkRateLimit(
  userId: string | null,
  ip: string
): Promise<RateLimitResult> {
  const supabase = await createServiceClient();
  const today = new Date().toISOString().split("T")[0];

  let query = supabase
    .from("usage_log")
    .select("*", { count: "exact", head: true })
    .gte("created_at", `${today}T00:00:00Z`);

  if (userId) {
    query = query.eq("user_id", userId);
  } else {
    query = query.eq("ip_address", ip);
  }

  const { count } = await query;

  const limit = userId ? PAID_DAILY_LIMIT : FREE_DAILY_LIMIT;
  const used = count ?? 0;

  return {
    allowed: used < limit,
    remaining: Math.max(0, limit - used),
  };
}
