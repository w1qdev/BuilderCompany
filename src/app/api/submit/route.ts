import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTelegramNotification } from "@/lib/telegram";
import { sendEmailNotification } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, email, service, message } = body;

    if (!name || !phone || !email || !service) {
      return NextResponse.json(
        { error: "Заполните все обязательные поля" },
        { status: 400 }
      );
    }

    const request = await prisma.request.create({
      data: { name, phone, email, service, message: message || null },
    });

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
