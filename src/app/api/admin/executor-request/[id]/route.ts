import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminAuth } from "@/lib/adminAuth";
import { sendStatusUpdateEmail } from "@/lib/email";
import { sendExecutorEmail } from "@/lib/executorEmail";
import { getIO } from "@/lib/socket";

export const dynamic = "force-dynamic";

// GET /api/admin/executor-request/[requestId]
// Fetch all executor requests for a given request
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const execReqs = await prisma.executorRequest.findMany({
    where: { requestId: Number(id) },
    include: { executor: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ executorRequests: execReqs });
}

// PATCH /api/admin/executor-request/[executorRequestId]
// Update executor request: pricing, approve, send-to-client, mark-paid
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { action, finalAmount, markup, executorId, customSubject, customMessage } = body;

  const execReq = await prisma.executorRequest.findUnique({
    where: { id: Number(id) },
    include: { request: { include: { items: true, files: true } }, executor: true },
  });
  if (!execReq) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};

  switch (action) {
    case "update-pricing": {
      if (finalAmount !== undefined) data.finalAmount = Number(finalAmount);
      if (markup !== undefined) data.markup = Number(markup);
      const fa = finalAmount !== undefined ? Number(finalAmount) : execReq.finalAmount;
      const mk = markup !== undefined ? Number(markup) : execReq.markup;
      if (fa != null && mk != null) {
        data.clientAmount = fa * (1 + mk / 100);
      }
      break;
    }

    case "approve": {
      data.status = "approved";
      data.approvedAt = new Date();
      if (finalAmount !== undefined) data.finalAmount = Number(finalAmount);
      if (markup !== undefined) data.markup = Number(markup);
      const fa = finalAmount !== undefined ? Number(finalAmount) : execReq.finalAmount;
      const mk = markup !== undefined ? Number(markup) : execReq.markup;
      if (fa != null && mk != null) {
        data.clientAmount = fa * (1 + mk / 100);
      }
      // Sync pricing to Request model
      await prisma.request.update({
        where: { id: execReq.requestId },
        data: {
          executorPrice: fa,
          markup: mk,
          clientPrice: fa != null && mk != null ? fa * (1 + mk / 100) : null,
        },
      });
      break;
    }

    case "send-to-client": {
      data.status = "sent_to_client";
      // Update request status
      await prisma.request.update({
        where: { id: execReq.requestId },
        data: { status: "pending_payment" },
      });
      // Send email to client
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://csm-center.ru";
      const paymentUrl = `${baseUrl}/payment/${execReq.paymentToken}`;
      const amountStr = execReq.clientAmount
        ? `${execReq.clientAmount.toLocaleString("ru-RU")} ₽`
        : "";
      sendStatusUpdateEmail({
        name: execReq.request.name,
        email: execReq.request.email,
        requestId: execReq.requestId,
        status: "pending_payment",
        adminNotes: `Сумма к оплате: ${amountStr}\n\nПодтвердить оплату: ${paymentUrl}`,
      }).catch(console.error);
      // Emit socket events
      const io = getIO();
      if (io) {
        io.emit("request-update", { id: execReq.requestId, status: "pending_payment" });
        if (execReq.request.userId) {
          io.to(`user:${execReq.request.userId}`).emit("request-status-changed", {
            requestId: execReq.requestId,
            status: "pending_payment",
            service: execReq.request.service,
          });
        }
      }
      break;
    }

    case "mark-client-paid": {
      data.status = "client_paid";
      data.clientPaidAt = new Date();
      await prisma.request.update({
        where: { id: execReq.requestId },
        data: { status: "review" },
      });
      const io2 = getIO();
      if (io2) {
        io2.emit("request-update", { id: execReq.requestId, status: "review" });
        io2.to("admin").emit("executor-payment-reminder", {
          requestId: execReq.requestId,
          executorName: execReq.executor.name,
          amount: execReq.finalAmount,
        });
      }
      break;
    }

    case "mark-executor-paid": {
      data.status = "executor_paid";
      data.executorPaidAt = new Date();
      await prisma.request.update({
        where: { id: execReq.requestId },
        data: { status: "done" },
      });
      const io3 = getIO();
      if (io3) {
        io3.emit("request-update", { id: execReq.requestId, status: "done" });
      }
      break;
    }

    case "approve-and-send": {
      // Admin confirmed the auto-matched executor — send email now
      let executor = execReq.executor;

      // Allow changing executor before sending
      if (executorId && executorId !== execReq.executorId) {
        const newExecutor = await prisma.executor.findUnique({ where: { id: Number(executorId) } });
        if (!newExecutor || !newExecutor.active) {
          return NextResponse.json({ error: "Исполнитель не найден или неактивен" }, { status: 404 });
        }
        executor = newExecutor;
        data.executorId = newExecutor.id;
      }

      const request = execReq.request;
      const items = request.items.map((i: { service: string; poverk: string | null; object: string | null; fabricNumber: string | null; registry: string | null }) => ({
        service: i.service,
        poverk: i.poverk || undefined,
        object: i.object || undefined,
        fabricNumber: i.fabricNumber || undefined,
        registry: i.registry || undefined,
      }));

      const messageId = await sendExecutorEmail({
        executorName: executor.name,
        executorEmail: executor.email,
        requestId: request.id,
        executorRequestId: execReq.id,
        clientCompany: request.company || request.name,
        clientInn: request.inn || undefined,
        items,
        message: customMessage || request.message || undefined,
        files: request.files?.map((f: { fileName: string; filePath: string }) => ({ fileName: f.fileName, filePath: f.filePath })),
        customSubject,
      });

      data.status = "awaiting_response";
      data.sentAt = new Date();
      if (messageId) data.emailMessageId = messageId;

      // Auto-advance request status
      if (request.status === "new") {
        await prisma.request.update({
          where: { id: request.id },
          data: { status: "in_progress" },
        });
        const io = getIO();
        if (io) {
          io.emit("request-update", { id: request.id, status: "in_progress" });
          if (request.userId) {
            io.to(`user:${request.userId}`).emit("request-status-changed", {
              requestId: request.id,
              status: "in_progress",
            });
            io.to(`user:${request.userId}`).emit("executor-assigned", {
              requestId: request.id,
              executorName: executor.name,
              message: `По вашей заявке #${request.id} найден исполнитель и отправлен запрос`,
            });
          }
        }
      }
      break;
    }

    default:
      return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
  }

  const updated = await prisma.executorRequest.update({
    where: { id: Number(id) },
    data,
    include: { executor: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json(updated);
}
