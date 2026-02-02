import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const password = req.headers.get("x-admin-password");
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const page = Number(searchParams.get("page")) || 1;
  const limit = 20;
  const search = searchParams.get("search")?.trim() || "";
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

  const [requests, total] = await Promise.all([
    prisma.request.findMany({
      where,
      orderBy: { [orderField]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
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
