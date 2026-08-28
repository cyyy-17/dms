// ============================================================================
// SASDMS - In-Memory Sliding-Window Rate Limiter
// Prevents API spamming, brute-force requests, and automated scraping
// ============================================================================

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Periodically clean up entries older than 10 minutes to prevent memory leak
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;
let lastCleanup = Date.now();

function performCleanup(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, record] of rateLimitStore.entries()) {
    // Retain only timestamps from the last 10 minutes
    record.timestamps = record.timestamps.filter((ts) => now - ts < CLEANUP_INTERVAL_MS);
    if (record.timestamps.length === 0) {
      rateLimitStore.delete(key);
    }
  }
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

/**
 * Check and record a rate-limit event for an identifier (e.g. user ID, IP, or action key)
 * @param identifier Unique rate-limiting key
 * @param limit Maximum allowed requests within the time window
 * @param windowMs Duration of the sliding window in milliseconds (e.g. 60,000 for 1 minute)
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 30,
  windowMs: number = 60000
): RateLimitResult {
  const now = Date.now();
  performCleanup(now);

  let record = rateLimitStore.get(identifier);
  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(identifier, record);
  }

  // Filter timestamps within current sliding window
  const windowStart = now - windowMs;
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  if (record.timestamps.length >= limit) {
    const oldestInWindow = record.timestamps[0];
    const resetAt = oldestInWindow + windowMs;
    return {
      success: false,
      limit,
      remaining: 0,
      resetAt,
    };
  }

  // Record this request
  record.timestamps.push(now);
  const remaining = Math.max(0, limit - record.timestamps.length);
  const resetAt = now + windowMs;

  return {
    success: true,
    limit,
    remaining,
    resetAt,
  };
}

/**
 * Pre-configured rate limit presets for institutional actions
 */
export const RATE_LIMIT_PRESETS = {
  DOCUMENT_INGESTION: { limit: 30, windowMs: 60 * 1000 },
  AUTH_ATTEMPT: { limit: 10, windowMs: 60 * 1000 },
  SIGNATURE_STAMP: { limit: 20, windowMs: 60 * 1000 },
  ADMIN_ACTION: { limit: 60, windowMs: 60 * 1000 },
  BULK_IMPORT: { limit: 5, windowMs: 60 * 1000 },
} as const;
