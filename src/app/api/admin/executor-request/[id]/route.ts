import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminAuth } from "@/lib/adminAuth";
import { sendStatusUpdateEmail } from "@/lib/email";
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
  const { action, finalAmount, markup } = body;

  const execReq = await prisma.executorRequest.findUnique({
    where: { id: Number(id) },
    include: { request: true, executor: true },
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
