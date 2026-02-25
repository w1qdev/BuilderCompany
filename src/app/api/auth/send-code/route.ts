import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSmsCode } from "@/lib/sms";
import { createRateLimiter } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const sendCodeLimiter = createRateLimiter({ max: 3, windowMs: 5 * 60 * 1000 });

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("8") && digits.length === 11) {
    return "7" + digits.slice(1);
  }
  return digits;
}

export async function POST(request: NextRequest) {
  if (!sendCodeLimiter(request)) {
    return NextResponse.json(
      { error: "Слишком много попыток. Попробуйте через 5 минут" },
      { status: 429 }
    );
  }

  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { error: "Номер телефона обязателен" },
        { status: 400 }
      );
    }

    const normalized = normalizePhone(phone);
    if (normalized.length !== 11 || !normalized.startsWith("7")) {
      return NextResponse.json(
        { error: "Некорректный номер телефона" },
        { status: 400 }
      );
    }

    const code = String(Math.floor(1000 + Math.random() * 9000));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.verificationCode.create({
      data: { phone: normalized, code, expiresAt },
    });

    await sendSmsCode(phone, code);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Send code error:", error);
    return NextResponse.json(
      { error: "Ошибка при отправке кода" },
      { status: 500 }
    );
  }
}
