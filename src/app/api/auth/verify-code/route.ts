import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SignJWT } from "jose";
import { JWT_SECRET } from "@/lib/jwt";
import { createRateLimiter } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const verifyCodeLimiter = createRateLimiter({
  max: 10,
  windowMs: 15 * 60 * 1000,
});

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("8") && digits.length === 11) {
    return "7" + digits.slice(1);
  }
  return digits;
}

export async function POST(request: NextRequest) {
  if (!verifyCodeLimiter(request)) {
    return NextResponse.json(
      { error: "Слишком много попыток. Попробуйте позже" },
      { status: 429 }
    );
  }

  try {
    const { phone, code, name, email, company } = await request.json();

    if (!phone || !code) {
      return NextResponse.json(
        { error: "Телефон и код обязательны" },
        { status: 400 }
      );
    }

    const normalized = normalizePhone(phone);

    // Find valid unused code
    const verification = await prisma.verificationCode.findFirst({
      where: {
        phone: normalized,
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!verification) {
      return NextResponse.json(
        { error: "Неверный или просроченный код" },
        { status: 400 }
      );
    }

    // Mark code as used
    await prisma.verificationCode.update({
      where: { id: verification.id },
      data: { used: true },
    });

    const isRegistration = !!name;

    let user;

    if (isRegistration) {
      // Check if phone already registered
      const existing = await prisma.user.findFirst({
        where: { phone: normalized },
      });

      if (existing) {
        return NextResponse.json(
          { error: "Пользователь с таким телефоном уже зарегистрирован" },
          { status: 400 }
        );
      }

      // Check email uniqueness if provided
      if (email) {
        const emailExists = await prisma.user.findUnique({
          where: { email },
        });
        if (emailExists) {
          return NextResponse.json(
            { error: "Пользователь с таким email уже существует" },
            { status: 400 }
          );
        }
      }

      user = await prisma.user.create({
        data: {
          name,
          phone: normalized,
          email: email || "",
          password: "",
          ...(company ? { company } : {}),
        },
      });
    } else {
      // Login mode — find user by phone
      user = await prisma.user.findFirst({
        where: { phone: normalized },
      });

      if (!user) {
        return NextResponse.json(
          { error: "Пользователь с таким телефоном не найден" },
          { status: 404 }
        );
      }

      if (user.banned) {
        return NextResponse.json(
          { error: "Ваш аккаунт заблокирован. Обратитесь к администратору." },
          { status: 403 }
        );
      }
    }

    // Create JWT (30 days)
    const token = await new SignJWT({ userId: user.id, email: user.email })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("30d")
      .sign(JWT_SECRET);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    console.error("Verify code error:", error);
    return NextResponse.json(
      { error: "Ошибка при проверке кода" },
      { status: 500 }
    );
  }
}
