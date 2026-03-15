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
  equipmentTypeId?: number;
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
    const toItem = (i: { service: string; poverk?: string | null; object?: string | null; fabricNumber?: string | null; registry?: string | null; equipmentTypeId?: number | null }): SubmitItem => ({
      service: i.service,
      poverk: i.poverk || undefined,
      object: i.object || undefined,
      fabricNumber: i.fabricNumber || undefined,
      registry: i.registry || undefined,
      equipmentTypeId: i.equipmentTypeId || undefined,
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
            equipmentTypeId: item.equipmentTypeId || null,
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

    // Auto-find executor (non-blocking) — mode-aware dispatch
    (async () => {
      try {
        const { findExecutorForService } = await import("@/lib/executorMatcher");
        const services = serviceItems.map((i) => i.service);
        const itemsForMatcher = serviceItems.map((i) => ({
          service: i.service,
          equipmentTypeId: i.equipmentTypeId || null,
        }));
        const matched = await findExecutorForService(services, itemsForMatcher);

        const { getIO } = await import("@/lib/socket");
        const ioInner = getIO();

        if (!matched) {
          // Notify admin that no executor was found
          if (ioInner) {
            ioInner.to("admin").emit("no-executor-found", {
              requestId: request.id,
              services,
            });
          }
          return;
        }

        // Read automation mode from settings
        const modeSetting = await prisma.setting.findUnique({
          where: { key: "automationMode" },
        });
        const mode = modeSetting?.value || "semi-auto";

        const { v4: uuidv4 } = await import("uuid");

        if (mode === "auto") {
          // Auto mode: create executor request, send email immediately, advance status
          const execReq = await prisma.executorRequest.create({
            data: {
              requestId: request.id,
              executorId: matched.id,
              status: "awaiting_response",
              paymentToken: uuidv4(),
              sentAt: new Date(),
            },
          });

          // Send email to executor immediately
          const { sendExecutorEmail } = await import("@/lib/executorEmail");
          const fullRequest = await prisma.request.findUnique({
            where: { id: request.id },
            include: { items: true, files: true },
          });

          const items = (fullRequest?.items || []).map((i: { service: string; poverk: string | null; object: string | null; fabricNumber: string | null; registry: string | null }) => ({
            service: i.service,
            poverk: i.poverk || undefined,
            object: i.object || undefined,
            fabricNumber: i.fabricNumber || undefined,
            registry: i.registry || undefined,
          }));

          const messageId = await sendExecutorEmail({
            executorName: matched.name,
            executorEmail: matched.email,
            requestId: request.id,
            executorRequestId: execReq.id,
            clientCompany: request.company || request.name,
            clientInn: request.inn || undefined,
            items,
            message: request.message || undefined,
            files: fullRequest?.files?.map((f: { fileName: string; filePath: string }) => ({ fileName: f.fileName, filePath: f.filePath })),
          });

          if (messageId) {
            await prisma.executorRequest.update({
              where: { id: execReq.id },
              data: { emailMessageId: messageId },
            });
          }

          // Advance request status to in_progress
          await prisma.request.update({
            where: { id: request.id },
            data: { status: "in_progress" },
          });

          // Notify admin via Socket.IO
          if (ioInner) {
            ioInner.emit("request-update", { id: request.id, status: "in_progress" });
            ioInner.to("admin").emit("auto-dispatched", {
              requestId: request.id,
              executorName: matched.name,
            });
            if (request.userId) {
              ioInner.to(`user:${request.userId}`).emit("request-status-changed", {
                requestId: request.id,
                status: "in_progress",
              });
              ioInner.to(`user:${request.userId}`).emit("executor-assigned", {
                requestId: request.id,
                executorName: matched.name,
                message: `По вашей заявке #${request.id} найден исполнитель и отправлен запрос`,
              });
            }
          }
        } else {
          // Semi-auto mode (default): create pending_approval, admin confirms before sending
          await prisma.executorRequest.create({
            data: {
              requestId: request.id,
              executorId: matched.id,
              status: "pending_approval",
              paymentToken: uuidv4(),
            },
          });

          // Notify admin via Socket.IO
          if (ioInner) {
            ioInner.to("admin").emit("executor-match-found", {
              requestId: request.id,
              executorName: matched.name,
            });
          }
        }
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
