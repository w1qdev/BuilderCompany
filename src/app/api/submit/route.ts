import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTelegramNotification } from "@/lib/telegram";
import { sendEmailNotification, sendConfirmationEmail } from "@/lib/email";
import { getIO } from "@/lib/socket";
import { jwtVerify } from "jose";
import { JWT_SECRET } from "@/lib/jwt";
import { unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, email, service, message, fileName, filePath } = body;

    if (!name || !phone || !email || !service) {
      return NextResponse.json(
        { error: "Заполните все обязательные поля" },
        { status: 400 }
      );
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Некорректный формат email" },
        { status: 400 }
      );
    }

    // Check if user is logged in
    let userId: number | null = null;
    const token = req.cookies.get("auth-token")?.value;
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        userId = payload.userId as number;
      } catch {
        // Invalid token, continue without user
      }
    }

    const request = await prisma.request.create({
      data: {
        name,
        phone,
        email,
        service,
        message: message || null,
        fileName: fileName || null,
        filePath: filePath || null,
        userId,
      },
    });

    // Emit realtime event to admin panel
    const io = getIO();
    if (io) {
      io.emit("new-request", request);
    }

    // Read notification settings
    const settings = await prisma.setting.findMany({
      where: { key: { in: ["emailNotifyAdmin", "emailNotifyCustomer", "notifyEmail", "telegramNotify"] } },
    });
    const isEnabled = (key: string) => {
      const found = settings.find((item) => item.key === key);
      return found ? found.value === "true" : true;
    };
    const getSetting = (key: string) => {
      const found = settings.find((item) => item.key === key);
      return found?.value;
    };

    // Send notifications in background (don't block response)
    const notifications: Promise<void>[] = [];
    if (isEnabled("telegramNotify")) {
      notifications.push(sendTelegramNotification({ name, phone, email, service, message }));
    }
    if (isEnabled("emailNotifyAdmin")) {
      notifications.push(sendEmailNotification({ name, phone, email, service, message, toEmail: getSetting("notifyEmail") }));
    }
    if (isEnabled("emailNotifyCustomer")) {
      notifications.push(sendConfirmationEmail({ name, email, service }));
    }
    Promise.allSettled(notifications).catch(console.error);

    return NextResponse.json({ success: true, id: request.id });
  } catch (error) {
    console.error("Submit error:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
