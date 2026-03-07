import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createRateLimiter } from "@/lib/rateLimit";
import { registerSchema, validate } from "@/lib/validation";
import { sendWelcomeEmail } from "@/lib/email";

export const dynamic = 'force-dynamic';

const registerLimiter = createRateLimiter({ max: 3, windowMs: 15 * 60 * 1000 });

export async function POST(request: NextRequest) {
  if (!registerLimiter(request)) {
    return NextResponse.json(
      { error: "Слишком много попыток. Попробуйте через 15 минут" },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const parsed = validate(registerSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const { email, password, name, phone, company } = parsed.data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Пользователь с таким email уже существует" },
        { status: 400 }
      );
    }

    // Check phone uniqueness if provided
    if (phone) {
      const phoneExists = await prisma.user.findUnique({
        where: { phone },
      });
      if (phoneExists) {
        return NextResponse.json(
          { error: "Пользователь с таким номером телефона уже зарегистрирован" },
          { status: 400 }
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone: phone || null,
        company: company || null,
      },
    });

    // Send welcome email (non-blocking)
    sendWelcomeEmail({ name: user.name, email: user.email }).catch(() => {});

    // Notify admin panel
    try {
      const { getIO } = await import("@/lib/socket");
      const io = getIO();
      if (io) {
        io.to("admin").emit("new-user-registered", { id: user.id, name: user.name, email: user.email });
      }
    } catch {}

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error: unknown) {
    console.error("Registration error:", error);
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Пользователь с такими данными уже зарегистрирован" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Ошибка при регистрации" },
      { status: 500 }
    );
  }
}
