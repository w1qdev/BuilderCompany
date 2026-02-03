import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTelegramNotification } from "@/lib/telegram";
import { sendEmailNotification } from "@/lib/email";
import { getIO } from "@/lib/socket";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
);

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

    // Send notifications in background (don't block response)
    Promise.allSettled([
      sendTelegramNotification({ name, phone, email, service, message }),
      sendEmailNotification({ name, phone, email, service, message }),
    ]).catch(console.error);

    return NextResponse.json({ success: true, id: request.id });
  } catch (error) {
    console.error("Submit error:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
