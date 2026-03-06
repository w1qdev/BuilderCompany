import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import { JWT_SECRET } from "@/lib/jwt";

export const dynamic = 'force-dynamic';

async function getUserId(request: NextRequest): Promise<number | null> {
  const token = request.cookies.get("auth-token")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.userId as number;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    // Invalidate old unused codes
    await prisma.maxLinkCode.updateMany({
      where: { userId, used: false },
      data: { used: true },
    });

    // Generate random 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));

    // Create code with 5 minute TTL
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await prisma.maxLinkCode.create({
      data: {
        code,
        userId,
        expiresAt,
      },
    });

    return NextResponse.json({ code, expiresAt });
  } catch (error) {
    console.error("Max link code generation error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const maxUser = await prisma.maxUser.findFirst({
      where: { userId },
    });

    return NextResponse.json({ linked: !!maxUser });
  } catch (error) {
    console.error("Max link check error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    await prisma.maxUser.deleteMany({
      where: { userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Max unlink error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
