import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import { JWT_SECRET } from "@/lib/jwt";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("auth-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as number;

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const status = url.searchParams.get("status") || undefined;
    const search = url.searchParams.get("search")?.trim() || undefined;

    // Build where clause
    const where: Record<string, unknown> = { userId };
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { service: { contains: search } },
        { company: { contains: search } },
        { email: { contains: search } },
        { message: { contains: search } },
      ];
    }

    const [requests, total] = await Promise.all([
      prisma.request.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: {
          files: true,
          items: {
            include: {
              equipment: {
                select: { id: true, name: true, status: true, nextVerification: true },
              },
            },
          },
        },
      }),
      prisma.request.count({ where }),
    ]);

    return NextResponse.json({
      requests,
      total,
      page,
      pages: Math.ceil(total / PAGE_SIZE),
    });
  } catch (error) {
    console.error("User requests error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
