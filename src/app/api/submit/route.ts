import { sendConfirmationEmail, sendEmailNotification } from "@/lib/email";
import { JWT_SECRET } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import { getIO } from "@/lib/socket";
import { sendTelegramNotification } from "@/lib/telegram";
import { existsSync } from "fs";
import { unlink } from "fs/promises";
import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  let uploadedFilePath: string | null = null;
  try {
    const body = await req.json();
    const { name, phone, email, service, message, fileName, filePath } = body;
    if (filePath) {
      uploadedFilePath = path.join(
        process.cwd(),
        "uploads",
        path.basename(filePath),
      );
    }

    if (!name || !phone || !email || !service) {
      return NextResponse.json(
        { error: "Заполните все обязательные поля" },
        { status: 400 },
      );
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Некорректный формат email" },
        { status: 400 },
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
      where: {
        key: {
          in: [
            "emailNotifyAdmin",
            "emailNotifyCustomer",
            "notifyEmail",
            "telegramNotify",
          ],
        },
      },
    });
    const isEnabled = (key: string) => {
      const found = settings.find((item) => item.key === key);
      return found ? found.value === "true" : true;
    };

    // Send notifications in background (don't block response)
    const notifications: Promise<void>[] = [];
    if (isEnabled("telegramNotify")) {
      notifications.push(
        sendTelegramNotification({
          name,
          phone,
          email,
          service,
          message,
        }),
      );
    }
    if (isEnabled("emailNotifyAdmin")) {
      notifications.push(
        sendEmailNotification({ name, phone, email, service, message }),
      );
    }
    if (isEnabled("emailNotifyCustomer")) {
      notifications.push(sendConfirmationEmail({ name, email, service }));
    }
    Promise.allSettled(notifications).catch(console.error);

    return NextResponse.json({ success: true, id: request.id });
  } catch (error) {
    if (uploadedFilePath && existsSync(uploadedFilePath)) {
      await unlink(uploadedFilePath).catch(() => {});
    }
    console.error("Submit error:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 },
    );
  }
}
