import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminPassword } from "@/lib/adminAuth";
import { createRateLimiter } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

// Ограничиваем частоту запросов к admin/users, чтобы усложнить перебор пароля
const adminUsersLimiter = createRateLimiter({ max: 60, windowMs: 60 * 1000 });

export async function GET(request: NextRequest) {
  if (!adminUsersLimiter(request)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const headerPassword = request.headers.get("x-admin-password") || "";
  if (!headerPassword || !(await verifyAdminPassword(headerPassword))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status");
  const page = Number(searchParams.get("page")) || 1;
  const limit = 20;

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { phone: { contains: search } },
      { company: { contains: search } },
    ];
  }
  if (status === "banned") where.banned = true;
  if (status === "active") where.banned = false;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        banned: true,
        createdAt: true,
        _count: { select: { requests: true, equipment: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({ users, total, pages: Math.ceil(total / limit) });
}

export async function PATCH(request: NextRequest) {
  if (!adminUsersLimiter(request)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const patchPassword = request.headers.get("x-admin-password") || "";
  if (!patchPassword || !(await verifyAdminPassword(patchPassword))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, name, email, phone, company } = body;

  try {
    const user = await prisma.user.update({
      where: { id },
      data: { name, email, phone: phone || null, company: company || null },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        banned: true,
      },
    });
    return NextResponse.json({ user });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json({ error: "Ошибка обновления" }, { status: 500 });
  }
}
