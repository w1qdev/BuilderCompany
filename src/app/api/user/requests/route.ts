import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import { JWT_SECRET } from "@/lib/jwt";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Не авторизован" },
        { status: 401 }
      );
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as number;

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page")) || 1;
    const limitParam = Number(searchParams.get("limit")) || 20;
    const limit = Math.min(Math.max(limitParam, 1), 100);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    // Build where clause
    const where: Record<string, unknown> = { userId };

    if (status && ["new", "in_progress", "done"].includes(status)) {
      where.status = status;
    }

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { service: { contains: term, mode: "insensitive" } },
        { name: { contains: term, mode: "insensitive" } },
        { message: { contains: term, mode: "insensitive" } },
      ];
    }

    const [requests, total] = await Promise.all([
      prisma.request.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { items: { include: { equipment: { select: { id: true, name: true, status: true, nextVerification: true } } } }, files: true },
      }),
      prisma.request.count({ where }),
    ]);

    return NextResponse.json({
      requests,
      total,
      pages: Math.ceil(total / limit),
      page,
    });
  } catch (error) {
    console.error("Get requests error:", error);
    return NextResponse.json(
      { error: "Ошибка при получении заявок" },
      { status: 500 }
    );
  }
}
