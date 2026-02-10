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
  return function isAllowed(req: NextRequest): boolean {
    const key = getIP(req);
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
