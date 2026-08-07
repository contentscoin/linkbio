const buckets = new Map<string, { count: number; resetAt: number }>();

/**
 * Cap on tracked keys. Without it the map grows once per distinct key forever
 * — expired buckets were never removed, so a spray of unique IPs was an
 * unbounded allocation on any instance that stays warm.
 */
const MAX_BUCKETS = 20_000;

function evictExpired(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

function evictOldest(target: number) {
  // Only reached when every bucket is still live; drop the ones closest to
  // expiring so the newest limits survive.
  const byExpiry = [...buckets.entries()].sort(
    (a, b) => a[1].resetAt - b[1].resetAt,
  );
  for (const [key] of byExpiry) {
    if (buckets.size <= target) break;
    buckets.delete(key);
  }
}

/**
 * Simple in-memory rate limit.
 *
 * Best-effort only: on serverless each instance keeps its own map, so the
 * effective limit is per-instance, not global. It raises the cost of naive
 * scripted abuse; it is not a substitute for a shared store.
 */
export async function enforceRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    if (buckets.size >= MAX_BUCKETS) {
      evictExpired(now);
      if (buckets.size >= MAX_BUCKETS) evictOldest(MAX_BUCKETS - 1);
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (existing.count >= limit) return false;
  existing.count += 1;
  return true;
}

/**
 * Client IP for rate-limit keys. Trusts `x-forwarded-for` because we sit
 * behind Vercel's proxy, which overwrites it — do not reuse this for
 * authorization decisions.
 */
export function clientIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;
  return headers.get("x-real-ip")?.trim() || "anon";
}

/** Test seam — drops all tracked buckets. */
export function resetRateLimitsForTest() {
  buckets.clear();
}

/** Test seam — number of tracked buckets, to assert the cap actually holds. */
export function rateLimitBucketCountForTest() {
  return buckets.size;
}
