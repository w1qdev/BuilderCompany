import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";
import { jwtVerify } from "jose";
import { JWT_SECRET } from "@/lib/jwt";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;
    if (!token) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as number;
    const currentHash = createHash("sha256").update(token).digest("hex");

    const sessions = await prisma.userSession.findMany({
      where: { userId, revoked: false },
      orderBy: { lastUsedAt: "desc" },
      select: { id: true, ip: true, userAgent: true, tokenHash: true, lastUsedAt: true, createdAt: true },
    });

    return NextResponse.json({
      sessions: sessions.map((s) => ({
        id: s.id,
        ip: s.ip,
        userAgent: s.userAgent,
        lastUsedAt: s.lastUsedAt,
        createdAt: s.createdAt,
        isCurrent: s.tokenHash === currentHash,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Ошибка" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;
    if (!token) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as number;

    const { sessionId } = await request.json();
    if (!sessionId) return NextResponse.json({ error: "ID сессии не указан" }, { status: 400 });

    await prisma.userSession.updateMany({
      where: { id: sessionId, userId },
      data: { revoked: true },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Ошибка" }, { status: 500 });
  }
}
