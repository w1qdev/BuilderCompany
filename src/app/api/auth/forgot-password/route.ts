import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createRateLimiter } from "@/lib/rateLimit";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const limiter = createRateLimiter({ max: 3, windowMs: 15 * 60 * 1000 });

export async function POST(request: NextRequest) {
  if (!limiter(request)) {
    return NextResponse.json(
      { error: "Слишком много попыток. Попробуйте через 15 минут" },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email обязателен" },
        { status: 400 }
      );
    }

    // Always return success to avoid revealing account existence
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.passwordReset.create({
        data: { email, token, expiresAt },
      });

      const host = request.headers.get("host") || "localhost:3000";
      const protocol = request.headers.get("x-forwarded-proto") || "http";
      const resetUrl = `${protocol}://${host}/reset-password?token=${token}`;

      // Send email asynchronously (non-blocking)
      sendPasswordResetEmail(email, resetUrl).catch((err) =>
        console.error("Failed to send password reset email:", err)
      );
    }

    return NextResponse.json({
      success: true,
      message: "Если аккаунт с таким email существует, мы отправили ссылку для сброса пароля",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Ошибка при обработке запроса" },
      { status: 500 }
    );
  }
}
