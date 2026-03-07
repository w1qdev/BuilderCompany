import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminPassword } from "@/lib/adminAuth";
import { createRateLimiter } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const adminStatsLimiter = createRateLimiter({ max: 60, windowMs: 60 * 1000 });

export async function GET(req: NextRequest) {
  if (!adminStatsLimiter(req)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const headerPassword = req.headers.get("x-admin-password");
  if (!headerPassword || !(await verifyAdminPassword(headerPassword))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [
    total,
    newCount,
    inProgressCount,
    pendingPaymentCount,
    reviewCount,
    doneCount,
    cancelledCount,
  ] = await Promise.all([
    prisma.request.count(),
    prisma.request.count({ where: { status: "new" } }),
    prisma.request.count({ where: { status: "in_progress" } }),
    prisma.request.count({ where: { status: "pending_payment" } }),
    prisma.request.count({ where: { status: "review" } }),
    prisma.request.count({ where: { status: "done" } }),
    prisma.request.count({ where: { status: "cancelled" } }),
  ]);

  return NextResponse.json({
    total,
    new: newCount,
    in_progress: inProgressCount,
    pending_payment: pendingPaymentCount,
    review: reviewCount,
    done: doneCount,
    cancelled: cancelledCount,
  });
}
