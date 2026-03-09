import { sendConfirmationEmail, sendEmailNotification } from "@/lib/email";
import { JWT_SECRET } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import { getIO } from "@/lib/socket";
import { sendMaxNotification } from "@/lib/max";
import { sendTelegramNotification } from "@/lib/telegram";
import { createRateLimiter } from "@/lib/rateLimit";
import { logActivity } from "@/lib/activityLog";
import { submitRequestSchema, validate } from "@/lib/validation";

const submitLimiter = createRateLimiter({ max: 10, windowMs: 15 * 60 * 1000 });

export const dynamic = 'force-dynamic';
import { existsSync } from "fs";
import { unlink } from "fs/promises";
import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

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
  if (!submitLimiter(req)) {
    return NextResponse.json(
      { error: "Слишком много запросов. Попробуйте через несколько минут." },
      { status: 429 }
    );
  }
  let uploadedFilePath: string | null = null;
  try {
    const body = await req.json();
    const parsed = validate(submitRequestSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const { name, phone, email, company, inn, message, fileName, filePath, needContract, addEquipment } = parsed.data;
    const submitFiles: SubmitFile[] = parsed.data.files || [];
    if (filePath) {
      uploadedFilePath = path.join(
        process.cwd(),
        "uploads",
        path.basename(filePath),
      );
    }

    // Support both old format (single service) and new format (items array)
    const toItem = (i: { service: string; poverk?: string | null; object?: string | null; fabricNumber?: string | null; registry?: string | null }): SubmitItem => ({
      service: i.service,
      poverk: i.poverk || undefined,
      object: i.object || undefined,
      fabricNumber: i.fabricNumber || undefined,
      registry: i.registry || undefined,
    });

    let serviceItems: SubmitItem[];
    if (parsed.data.items && parsed.data.items.length > 0) {
      serviceItems = parsed.data.items.map(toItem);
    } else if (parsed.data.service) {
      serviceItems = [toItem({
        service: parsed.data.service,
        poverk: parsed.data.poverk,
        object: parsed.data.object,
        fabricNumber: parsed.data.fabricNumber,
        registry: parsed.data.registry,
      })];
    } else {
      return NextResponse.json(
        { error: "Заполните все обязательные поля" },
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
      // Find user's first organization
      const userMembership = await prisma.organizationMember.findFirst({
        where: { userId },
        select: { organizationId: true },
      });

      if (userMembership) {
        const serviceCategoryMap: Record<string, string> = {
          "Поверка СИ": "verification",
          "Калибровка": "calibration",
          "Аттестация": "attestation",
        };
        const equipmentData = serviceItems
          .filter((item) => item.object?.trim())
          .map((item) => ({
            userId,
            organizationId: userMembership.organizationId,
            name: item.object!.trim(),
            serialNumber: item.fabricNumber?.trim() || null,
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
    }

    // Log activity for logged-in users
    if (userId) {
      logActivity({ userId, action: "request_created", entityType: "request", entityId: request.id, details: JSON.stringify({ service: serviceJoined }) });
    }

    // Emit realtime event to admin panel
    const io = getIO();
    if (io) {
      io.emit("new-request", request);
    }

    // Auto-find executor and send email (non-blocking)
    (async () => {
      try {
        const { findExecutorForService } = await import("@/lib/executorMatcher");
        const services = serviceItems.map((i) => i.service);
        const matched = await findExecutorForService(services);
        if (!matched) return;

        const { v4: uuidv4 } = await import("uuid");
        const executorRequest = await prisma.executorRequest.create({
          data: {
            requestId: request.id,
            executorId: matched.id,
            status: "awaiting_response",
            sentAt: new Date(),
            paymentToken: uuidv4(),
          },
        });

        const { sendExecutorEmail } = await import("@/lib/executorEmail");
        const msgId = await sendExecutorEmail({
          executorName: matched.name,
          executorEmail: matched.email,
          requestId: request.id,
          executorRequestId: executorRequest.id,
          clientCompany: company || name,
          clientInn: inn || undefined,
          items: serviceItems,
          message: message || undefined,
          files: submitFiles,
        });

        if (msgId) {
          await prisma.executorRequest.update({
            where: { id: executorRequest.id },
            data: { emailMessageId: msgId },
          });
        }

        // Auto-advance status
        await prisma.request.update({
          where: { id: request.id },
          data: { status: "in_progress" },
        });
      } catch (err) {
        console.error("Auto executor match error:", err);
      }
    })();

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
          company: company || undefined,
          inn: inn || undefined,
          message: message || undefined,
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
          company: company || undefined,
          inn: inn || undefined,
          message: message || undefined,
          needContract,
          fileName: fileName || undefined,
          filePath: filePath || undefined,
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
          company: company || undefined,
          inn: inn || undefined,
          message: message || undefined,
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
