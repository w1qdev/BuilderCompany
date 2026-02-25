import { describe, it, expect, vi } from "vitest";
import { createRateLimiter } from "@/lib/rateLimit";

// Mock NextRequest
function mockRequest(ip = "127.0.0.1") {
  return {
    headers: {
      get: (name: string) => (name === "x-forwarded-for" ? ip : null),
    },
  } as Parameters<ReturnType<typeof createRateLimiter>>[0];
}

// Use unique IPs per test to avoid shared store pollution
let ipCounter = 0;
function uniqueIp() {
  ipCounter++;
  return `10.0.0.${ipCounter}`;
}

describe("createRateLimiter", () => {
  it("allows requests within limit", () => {
    const limiter = createRateLimiter({ max: 3, windowMs: 60000 });
    const ip = uniqueIp();
    const req = mockRequest(ip);

    expect(limiter(req)).toBe(true);
    expect(limiter(req)).toBe(true);
    expect(limiter(req)).toBe(true);
  });

  it("blocks requests exceeding limit", () => {
    const limiter = createRateLimiter({ max: 2, windowMs: 60000 });
    const ip = uniqueIp();
    const req = mockRequest(ip);

    expect(limiter(req)).toBe(true);
    expect(limiter(req)).toBe(true);
    expect(limiter(req)).toBe(false);
  });

  it("resets after window expires", () => {
    vi.useFakeTimers();
    const limiter = createRateLimiter({ max: 1, windowMs: 1000 });
    const ip = uniqueIp();
    const req = mockRequest(ip);

    expect(limiter(req)).toBe(true);
    expect(limiter(req)).toBe(false);

    vi.advanceTimersByTime(1001);

    expect(limiter(req)).toBe(true);
    vi.useRealTimers();
  });

  it("tracks different IPs separately", () => {
    const limiter = createRateLimiter({ max: 1, windowMs: 60000 });
    const ip1 = uniqueIp();
    const ip2 = uniqueIp();
    const req1 = mockRequest(ip1);
    const req2 = mockRequest(ip2);

    expect(limiter(req1)).toBe(true);
    expect(limiter(req1)).toBe(false);
    expect(limiter(req2)).toBe(true);
  });

  it("uses userId when provided (per-user limiting)", () => {
    const limiter = createRateLimiter({ max: 1, windowMs: 60000 });
    const ip = uniqueIp();
    const req = mockRequest(ip);
    const uid1 = 10000 + ipCounter;
    const uid2 = 20000 + ipCounter;

    expect(limiter(req, uid1)).toBe(true);
    expect(limiter(req, uid2)).toBe(true);
    expect(limiter(req, uid1)).toBe(false);
    expect(limiter(req, uid2)).toBe(false);
  });

  it("userId limiter is separate from IP limiter", () => {
    const limiter = createRateLimiter({ max: 1, windowMs: 60000 });
    const ip = uniqueIp();
    const req = mockRequest(ip);
    const uid = 30000 + ipCounter;

    // Use as IP-based
    expect(limiter(req)).toBe(true);
    expect(limiter(req)).toBe(false);

    // User-based should still have its own quota
    expect(limiter(req, uid)).toBe(true);
  });
});
