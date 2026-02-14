import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import { JWT_SECRET } from "@/lib/jwt";
import bcrypt from "bcryptjs";
import { createRateLimiter } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const limiter = createRateLimiter({ max: 5, windowMs: 15 * 60 * 1000 });

export async function POST(request: NextRequest) {
  if (!limiter(request)) {
    return NextResponse.json(
      { error: "Слишком много попыток. Попробуйте через 15 минут" },
      { status: 429 }
    );
  }

  try {
    const token = request.cookies.get("auth-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as number;

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Все поля обязательны" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Новый пароль должен быть не менее 6 символов" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json(
        { error: "Пользователь не найден" },
        { status: 404 }
      );
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Неверный текущий пароль" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { error: "Ошибка при смене пароля" },
      { status: 500 }
    );
  }
}
