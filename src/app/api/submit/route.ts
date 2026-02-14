import { sendConfirmationEmail, sendEmailNotification } from "@/lib/email";
import { JWT_SECRET } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import { getIO } from "@/lib/socket";
import { sendMaxNotification } from "@/lib/max";
import { sendTelegramNotification } from "@/lib/telegram";

export const dynamic = 'force-dynamic';
import { existsSync } from "fs";
import { unlink } from "fs/promises";
import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface SubmitItem {
  service: string;
  poverk?: string;
  object?: string;
  fabricNumber?: string;
  registry?: string;
}

interface SubmitFile {
  fileName: string;
  filePath: string;
}

export async function POST(req: NextRequest) {
  let uploadedFilePath: string | null = null;
  try {
    const body = await req.json();
    const { name, phone, email, company, inn, message, fileName, filePath, items, needContract, addEquipment } = body;
    const submitFiles: SubmitFile[] = Array.isArray(body.files) ? body.files : [];
    if (filePath) {
      uploadedFilePath = path.join(
        process.cwd(),
        "uploads",
        path.basename(filePath),
      );
    }

    // Support both old format (single service) and new format (items array)
    let serviceItems: SubmitItem[];
    if (Array.isArray(items) && items.length > 0) {
      serviceItems = items;
    } else if (body.service) {
      // Backwards compatibility: single service field
      serviceItems = [{
        service: body.service,
        poverk: body.poverk,
        object: body.object,
        fabricNumber: body.fabricNumber,
        registry: body.registry,
      }];
    } else {
      return NextResponse.json(
        { error: "Заполните все обязательные поля" },
        { status: 400 },
      );
    }

    if (!name || !phone || !email) {
      return NextResponse.json(
        { error: "Заполните все обязательные поля" },
        { status: 400 },
      );
    }

    // Validate each item has a service
    for (const item of serviceItems) {
      if (!item.service) {
        return NextResponse.json(
          { error: "Каждая позиция должна содержать услугу" },
          { status: 400 },
        );
      }
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

    // Backwards compat: fill flat fields from first item
    const firstItem = serviceItems[0];
    const serviceJoined = serviceItems.map(i => i.service).join(", ");

    const request = await prisma.request.create({
      data: {
        name,
        phone,
        email,
        company: company || null,
        inn: inn || null,
        service: serviceJoined,
        object: firstItem.object || null,
        fabricNumber: firstItem.fabricNumber || null,
        registry: firstItem.registry || null,
        poverk: firstItem.poverk || null,
        message: message || null,
        fileName: fileName || null,
        filePath: filePath || null,
        needContract: needContract || false,
        userId,
        items: {
          create: serviceItems.map(item => ({
            service: item.service,
            poverk: item.poverk || null,
            object: item.object || null,
            fabricNumber: item.fabricNumber || null,
            registry: item.registry || null,
          })),
        },
      },
      include: { items: true, files: true },
    });

    // Create RequestFile records for uploaded files
    if (submitFiles.length > 0) {
      await prisma.requestFile.createMany({
        data: submitFiles.map((f) => ({
          requestId: request.id,
          fileName: f.fileName,
          filePath: f.filePath,
        })),
      });
    }

    // If user is logged in and checked "add equipment", save items as equipment
    if (addEquipment && userId) {
      const serviceCategoryMap: Record<string, string> = {
        "Поверка СИ": "verification",
        "Калибровка": "calibration",
        "Аттестация": "attestation",
      };
      const equipmentData = serviceItems
        .filter((item) => item.object?.trim())
        .map((item) => ({
          userId,
          name: item.object!.trim(),
          serialNumber: item.fabricNumber?.trim() || null,
          registryNumber: item.registry?.trim() || null,
          category: serviceCategoryMap[item.service] || "verification",
          status: "active",
          interval: 12,
          company: company || null,
          contactEmail: email || null,
        }));

      if (equipmentData.length > 0) {
        await prisma.equipment.createMany({ data: equipmentData });
      }
    }

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
            "maxNotify",
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
          company,
          inn,
          message,
          items: serviceItems,
        }),
      );
    }
    if (isEnabled("emailNotifyAdmin")) {
      notifications.push(
        sendEmailNotification({
          name,
          phone,
          email,
          company,
          inn,
          message,
          needContract,
          fileName,
          filePath,
          files: submitFiles,
          requestId: request.id,
          items: serviceItems,
        }),
      );
    }
    if (isEnabled("emailNotifyCustomer")) {
      notifications.push(sendConfirmationEmail({ name, email, requestId: request.id, items: serviceItems }));
    }
    if (isEnabled("maxNotify")) {
      notifications.push(
        sendMaxNotification({
          name,
          phone,
          email,
          company,
          inn,
          message,
          items: serviceItems,
        }),
      );
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
