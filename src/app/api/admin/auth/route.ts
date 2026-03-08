import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminPassword } from "@/lib/adminAuth";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { JWT_SECRET } from "@/lib/jwt";
import { createRateLimiter } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const limiter = createRateLimiter({ max: 10, windowMs: 60 * 1000 });

export async function POST(req: NextRequest) {
  if (!limiter(req)) {
    return NextResponse.json(
      { error: "Слишком много попыток. Попробуйте позже." },
      { status: 429 }
    );
  }

  try {
    const { login, password } = await req.json();

    if (!password) {
      return NextResponse.json(
        { error: "Пароль обязателен" },
        { status: 400 }
      );
    }

    // Mode 1: Staff login (login + password provided)
    if (login) {
      const staff = await prisma.staff.findUnique({ where: { login } });
      if (
        staff &&
        staff.active &&
        (await bcrypt.compare(password, staff.password))
      ) {
        const token = await new SignJWT({
          staffId: staff.id,
          role: staff.role,
        })
          .setProtectedHeader({ alg: "HS256" })
          .setExpirationTime("12h")
          .sign(JWT_SECRET);

        return NextResponse.json({
          authenticated: true,
          role: staff.role,
          staffId: staff.id,
          name: staff.name,
          token,
        });
      }
      return NextResponse.json(
        { error: "Неверный логин или пароль" },
        { status: 401 }
      );
    }

    // Mode 2: Admin password only (legacy)
    if (await verifyAdminPassword(password)) {
      const token = await new SignJWT({ staffId: null, role: "admin" })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("12h")
        .sign(JWT_SECRET);

      return NextResponse.json({
        authenticated: true,
        role: "admin",
        staffId: null,
        name: "Администратор",
        token,
      });
    }

    return NextResponse.json(
      { error: "Неверный пароль" },
      { status: 401 }
    );
  } catch (error) {
    console.error("Admin auth error:", error);
    return NextResponse.json(
      { error: "Ошибка авторизации" },
      { status: 500 }
    );
  }
}
