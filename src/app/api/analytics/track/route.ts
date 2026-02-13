import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createRateLimiter } from "@/lib/rateLimit";

const limiter = createRateLimiter({ max: 60, windowMs: 60000 });

export async function POST(request: NextRequest) {
  try {
    if (!limiter(request)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { url, userId } = await request.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL required" }, { status: 400 });
    }

    await prisma.pageView.create({
      data: {
        url: url.slice(0, 500),
        userAgent: request.headers.get("user-agent")?.slice(0, 500) || null,
        ip: ip.slice(0, 45),
        userId: userId || null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Track error:", error);
    return NextResponse.json({ ok: true }); // Don't fail silently
  }
}
