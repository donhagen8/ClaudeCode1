export type UserTier = "free" | "founding" | "earlybird" | "pro";

export interface Profile {
  id: string;
  tier: UserTier;
  tier_expires_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
}

export interface UsageLogEntry {
  id: number;
  user_id: string | null;
  operation: string;
  file_size_bytes: number;
  duration_ms: number;
  created_at: string;
}

export interface ConfigEntry {
  key: string;
  value: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

export interface ApiError {
  error: string;
  code: string;
}

export type CompressionLevel = "low" | "medium" | "high";
