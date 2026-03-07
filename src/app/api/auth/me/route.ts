import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import { JWT_SECRET } from "@/lib/jwt";

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;
    if (!token) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as number;
    const body = await request.json();
    const { name, phone, company, inn, kpp, legalName, legalAddress, notifyDays, telegramChatId, position, timezone } = body;
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(company !== undefined && { company: company || null }),
        ...(inn !== undefined && { inn: inn || null }),
        ...(kpp !== undefined && { kpp: kpp || null }),
        ...(legalName !== undefined && { legalName: legalName || null }),
        ...(legalAddress !== undefined && { legalAddress: legalAddress || null }),
        ...(notifyDays !== undefined && { notifyDays }),
        ...(telegramChatId !== undefined && { telegramChatId }),
        ...(position !== undefined && { position: position || null }),
        ...(timezone !== undefined && { timezone: timezone || null }),
      },
      select: { id: true, email: true, name: true, phone: true, company: true, inn: true, kpp: true, legalName: true, legalAddress: true, notifyDays: true, telegramChatId: true, avatar: true, coverImage: true, position: true, timezone: true },
    });
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        company: true,
        inn: true,
        kpp: true,
        legalName: true,
        legalAddress: true,
        notifyDays: true,
        telegramChatId: true,
        avatar: true,
        coverImage: true,
        position: true,
        timezone: true,
        createdAt: true,
        banned: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Пользователь не найден" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json(
      { error: "Не авторизован" },
      { status: 401 }
    );
  }
}
