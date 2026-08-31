/**
 * Simple in-memory rate limiter using Maps.
 * Useful for Edge/Serverless environments where Redis is not available.
 * 
 * Note: Since serverless functions are ephemeral, this limits requests per-instance.
 * For strict global rate limiting, use a Redis-based solution (e.g. Upstash).
 */

const limiters = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number; reset: number } {
  const now = Date.now();
  
  // Lazy cleanup (10% chance per check to clean expired records)
  if (Math.random() < 0.1) {
    limiters.forEach((record, key) => {
      if (now > record.resetAt) {
        limiters.delete(key);
      }
    });
  }

  const record = limiters.get(identifier);
  if (!record || now > record.resetAt) {
    limiters.set(identifier, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, reset: now + windowMs };
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0, reset: record.resetAt };
  }

  record.count += 1;
  return { success: true, remaining: limit - record.count, reset: record.resetAt };
}
