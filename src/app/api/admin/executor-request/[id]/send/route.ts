import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminAuth } from "@/lib/adminAuth";
import { sendExecutorEmail } from "@/lib/executorEmail";
import { findExecutorForService } from "@/lib/executorMatcher";
import { v4 as uuidv4 } from "uuid";
import { getIO } from "@/lib/socket";

export const dynamic = "force-dynamic";

// POST /api/admin/executor-request/[requestId]/send
// Send (or resend) request to an executor
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const requestId = Number(id);
  const body = await req.json().catch(() => ({}));

  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: { items: true, files: true },
  });
  if (!request) {
    return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
  }

  // Find executor
  let executor;
  if (body.executorId) {
    executor = await prisma.executor.findUnique({ where: { id: body.executorId } });
  } else {
    const services = request.items.length > 0
      ? request.items.map((i) => i.service)
      : [request.service];
    const matched = await findExecutorForService(services);
    if (!matched) {
      return NextResponse.json(
        { error: "Исполнитель не найден для данной услуги" },
        { status: 404 }
      );
    }
    executor = await prisma.executor.findUnique({ where: { id: matched.id } });
  }

  if (!executor || !executor.active) {
    return NextResponse.json(
      { error: "Исполнитель не найден или неактивен" },
      { status: 404 }
    );
  }

  // Create ExecutorRequest
  const executorRequest = await prisma.executorRequest.create({
    data: {
      requestId,
      executorId: executor.id,
      status: "awaiting_response",
      sentAt: new Date(),
      paymentToken: uuidv4(),
    },
  });

  // Send email to executor
  const items = request.items.map((i) => ({
    service: i.service,
    poverk: i.poverk || undefined,
    object: i.object || undefined,
    fabricNumber: i.fabricNumber || undefined,
    registry: i.registry || undefined,
  }));

  const messageId = await sendExecutorEmail({
    executorName: executor.name,
    executorEmail: executor.email,
    requestId,
    executorRequestId: executorRequest.id,
    clientCompany: request.company || request.name,
    clientInn: request.inn || undefined,
    items,
    message: request.message || undefined,
    files: request.files?.map((f) => ({ fileName: f.fileName, filePath: f.filePath })),
  });

  // Save messageId for IMAP matching
  if (messageId) {
    await prisma.executorRequest.update({
      where: { id: executorRequest.id },
      data: { emailMessageId: messageId },
    });
  }

  // Auto-advance request status
  if (request.status === "new") {
    await prisma.request.update({
      where: { id: requestId },
      data: { status: "in_progress" },
    });
    const io = getIO();
    if (io) {
      io.emit("request-update", { id: requestId, status: "in_progress" });
    }
  }

  return NextResponse.json({
    executorRequest: { ...executorRequest, emailMessageId: messageId },
    executor: { id: executor.id, name: executor.name, email: executor.email },
  });
}
