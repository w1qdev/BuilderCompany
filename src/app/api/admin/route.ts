import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminPassword } from "@/lib/adminAuth";
import { createRateLimiter } from "@/lib/rateLimit";

export const dynamic = 'force-dynamic';

const adminLimiter = createRateLimiter({ max: 120, windowMs: 60 * 1000 });

export async function GET(req: NextRequest) {
  if (!adminLimiter(req)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const headerPassword = req.headers.get("x-admin-password");
  if (!headerPassword || !(await verifyAdminPassword(headerPassword))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const page = Number(searchParams.get("page")) || 1;
  const limit = 20;
  const search = (searchParams.get("search")?.trim() || "").slice(0, 100);
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

  const allowedSortFields = ["createdAt", "name", "service", "status"];
  const orderField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";

  const statusFilter = status && status !== "all" ? { status } : {};
  const searchFilter = search
    ? {
        OR: [
          { name: { contains: search } },
          { phone: { contains: search } },
          { email: { contains: search } },
        ],
      }
    : {};

  const where = { ...statusFilter, ...searchFilter };

  const isExport = searchParams.get("export") === "true";

  if (isExport) {
    const requests = await prisma.request.findMany({
      where,
      orderBy: { [orderField]: sortOrder },
      include: { items: true, files: true },
    });
    return NextResponse.json({ requests, total: requests.length });
  }

  const [requests, total] = await Promise.all([
    prisma.request.findMany({
      where,
      orderBy: { [orderField]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      include: { items: true, files: true },
    }),
    prisma.request.count({ where }),
  ]);

  return NextResponse.json({
    requests,
    total,
    pages: Math.ceil(total / limit),
    page,
  });
}
