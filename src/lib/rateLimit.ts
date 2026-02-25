import { NextRequest } from "next/server";

const store = new Map<string, { count: number; resetAt: number }>();

function getIP(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
}

export function createRateLimiter({
  max,
  windowMs,
}: {
  max: number;
  windowMs: number;
}) {
  return function isAllowed(req: NextRequest, userId?: number | null): boolean {
    // Use userId if available, otherwise fall back to IP
    const key = userId ? `user:${userId}` : `ip:${getIP(req)}`;
    const currentMoment = Date.now();
    const record = store.get(key);
    if (!record || currentMoment > record.resetAt) {
      store.set(key, { count: 1, resetAt: currentMoment + windowMs });
      return true;
    }
    if (record.count >= max) {
      return false;
    }
    record.count++;
    return true;
  };
}

// Periodically clean up expired entries (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of store) {
    if (now > record.resetAt) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);
