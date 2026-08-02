type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

function memoryLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (current.count >= limit) {
    return false;
  }

  current.count += 1;
  return true;
}

/** Sync fallback used when Upstash is not configured. */
export function checkRateLimit(key: string, limit: number, windowMs: number) {
  return memoryLimit(key, limit, windowMs);
}

function upstashConfigured() {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() &&
      process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
  );
}

/**
 * Prefer Upstash Redis sliding window when env is set; otherwise in-memory.
 */
export async function enforceRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  if (!upstashConfigured()) {
    return memoryLimit(key, limit, windowMs);
  }

  const base = process.env.UPSTASH_REDIS_REST_URL!.replace(/\/$/, "");
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
  const redisKey = `rl:${key}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  try {
    const response = await fetch(`${base}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["ZREMRANGEBYSCORE", redisKey, "0", String(windowStart)],
        ["ZADD", redisKey, String(now), `${now}:${Math.random().toString(36).slice(2, 8)}`],
        ["ZCARD", redisKey],
        ["PEXPIRE", redisKey, String(windowMs)],
      ]),
    });

    if (!response.ok) {
      console.error("Upstash rate limit failed; falling back to memory.", response.status);
      return memoryLimit(key, limit, windowMs);
    }

    const results = (await response.json()) as Array<{ result: number }>;
    const count = Number(results[2]?.result ?? 0);
    return count <= limit;
  } catch (error) {
    console.error("Upstash rate limit error; falling back to memory.", error);
    return memoryLimit(key, limit, windowMs);
  }
}

export const rateLimitDeploymentNote =
  "Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for production rate limits.";
