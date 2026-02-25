import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import { JWT_SECRET } from "@/lib/jwt";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    let userId: number;
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      userId = payload.userId as number;
    } catch {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(1, Number(searchParams.get("limit")) || 20), 50);

    const activities = await prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        details: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ activities });
  } catch (error) {
    console.error("Get activity log error:", error);
    return NextResponse.json({ error: "Ошибка при получении журнала активности" }, { status: 500 });
  }
}
