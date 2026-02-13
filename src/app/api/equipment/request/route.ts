import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import { JWT_SECRET } from "@/lib/jwt";
import { sendEmailNotification, sendConfirmationEmail } from "@/lib/email";
import { getIO } from "@/lib/socket";
import { sendTelegramNotification } from "@/lib/telegram";

async function getUserId(request: NextRequest): Promise<number | null> {
  const token = request.cookies.get("auth-token")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.userId as number;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { equipmentIds } = await request.json();
    if (!equipmentIds || !Array.isArray(equipmentIds) || equipmentIds.length === 0) {
      return NextResponse.json({ error: "Выберите оборудование" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    }

    const equipment = await prisma.equipment.findMany({
      where: { id: { in: equipmentIds }, userId },
    });

    if (equipment.length === 0) {
      return NextResponse.json({ error: "Оборудование не найдено" }, { status: 404 });
    }

    // Build items from equipment
    const categoryLabels: Record<string, string> = {
      verification: "Поверка СИ",
      calibration: "Калибровка СИ",
      attestation: "Аттестация ИО",
    };

    const items = equipment.map((eq) => ({
      service: categoryLabels[eq.category] || "Поверка СИ",
      object: eq.name + (eq.type ? ` (${eq.type})` : ""),
      fabricNumber: eq.serialNumber || undefined,
      registry: eq.registryNumber || undefined,
      poverk: eq.category === "verification" ? "периодическая" : undefined,
    }));

    const mainService = items.length === 1 ? items[0].service : `${items.length} позиций`;

    // Create request with items
    const newRequest = await prisma.request.create({
      data: {
        name: user.name,
        phone: user.phone || "",
        email: user.email,
        company: user.company,
        service: mainService,
        message: `Заявка из личного кабинета на ${equipment.length} ед. оборудования`,
        status: "new",
        userId,
        items: {
          create: items.map((item) => ({
            service: item.service,
            object: item.object,
            fabricNumber: item.fabricNumber || null,
            registry: item.registry || null,
            poverk: item.poverk || null,
          })),
        },
      },
      include: { items: true },
    });

    // Emit socket event
    const io = getIO();
    if (io) {
      io.emit("new-request", newRequest);
    }

    // Async notifications (non-blocking)
    const notificationItems = items.map((i) => ({
      service: i.service,
      object: i.object,
      fabricNumber: i.fabricNumber,
      registry: i.registry,
      poverk: i.poverk,
    }));

    Promise.allSettled([
      sendEmailNotification({
        name: user.name,
        phone: user.phone || "",
        email: user.email,
        company: user.company || undefined,
        requestId: newRequest.id,
        items: notificationItems,
      }),
      sendConfirmationEmail({
        name: user.name,
        email: user.email,
        requestId: newRequest.id,
        items: notificationItems,
      }),
      sendTelegramNotification({
        name: user.name,
        phone: user.phone || "",
        email: user.email,
        company: user.company || undefined,
        items: notificationItems,
      }),
    ]).catch(() => {});

    return NextResponse.json({ success: true, requestId: newRequest.id });
  } catch (error) {
    console.error("Equipment request error:", error);
    return NextResponse.json({ error: "Ошибка при создании заявки" }, { status: 500 });
  }
}
