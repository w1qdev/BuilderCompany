import { NextRequest, NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/telegram";
import { createRateLimiter } from "@/lib/rateLimit";
import { jwtVerify } from "jose";
import { JWT_SECRET } from "@/lib/jwt";
import { z } from "zod";
import { validate } from "@/lib/validation";

const bugReportSchema = z.object({
  message: z.string().min(5, "Опишите проблему подробнее (минимум 5 символов)").max(2000),
  page: z.string().max(500).optional(),
  userAgent: z.string().max(500).optional(),
});

const limiter = createRateLimiter({ max: 3, windowMs: 15 * 60 * 1000 });

export async function POST(request: NextRequest) {
  if (!limiter(request)) {
    return NextResponse.json({ error: "Слишком много сообщений. Попробуйте позже" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const parsed = validate(bugReportSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { message, page, userAgent } = parsed.data;

    // Try to get user info
    let userName = "Гость";
    let userEmail = "";
    const token = request.cookies.get("auth-token")?.value;
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        userName = (payload.name as string) || "Пользователь";
        userEmail = (payload.email as string) || "";
      } catch {
        // ignore
      }
    }

    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!chatId) {
      return NextResponse.json({ error: "Уведомления не настроены" }, { status: 500 });
    }

    const text = [
      "🐛 *Сообщение об ошибке*",
      "",
      `👤 *От:* ${userName}${userEmail ? ` (${userEmail})` : ""}`,
      page ? `📍 *Страница:* ${page}` : "",
      `💬 *Описание:*\n${message}`,
      userAgent ? `\n🖥 *Браузер:* ${userAgent.slice(0, 200)}` : "",
      `\n🕐 *Время:* ${new Date().toLocaleString("ru-RU", { timeZone: "Europe/Moscow" })}`,
    ].filter(Boolean).join("\n");

    await sendTelegramMessage(text, chatId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Bug report error:", error);
    return NextResponse.json({ error: "Ошибка отправки" }, { status: 500 });
  }
}
