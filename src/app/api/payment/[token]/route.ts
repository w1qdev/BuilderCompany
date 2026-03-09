import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getIO } from "@/lib/socket";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

// GET /api/payment/[token] — public payment info
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const execReq = await prisma.executorRequest.findUnique({
    where: { paymentToken: token },
    include: {
      request: { select: { id: true, service: true, name: true, company: true } },
      executor: { select: { name: true } },
    },
  });

  if (!execReq) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  return NextResponse.json({
    requestId: execReq.request.id,
    service: execReq.request.service,
    company: execReq.request.company,
    clientName: execReq.request.name,
    clientAmount: execReq.clientAmount,
    status: execReq.status,
    executorName: execReq.executor.name,
  });
}

// POST /api/payment/[token] — confirm payment with optional proof file
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const execReq = await prisma.executorRequest.findUnique({
    where: { paymentToken: token },
    include: {
      request: true,
      executor: { select: { name: true } },
    },
  });

  if (!execReq) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  if (execReq.status !== "sent_to_client") {
    return NextResponse.json(
      { error: "Оплата уже подтверждена или недоступна" },
      { status: 400 }
    );
  }

  let paymentProofFile: string | null = null;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (file && file.size > 0) {
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/webp",
      ];

      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: "Недопустимый тип файла. Разрешены: PDF, JPEG, PNG, WebP" },
          { status: 400 }
        );
      }

      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Размер файла превышает 10 МБ" },
          { status: 400 }
        );
      }

      const uploadsDir = path.join(process.cwd(), "uploads", "payment-proofs");
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
      }

      const ext = path.extname(file.name);
      const safeFileName = `${execReq.id}_${Date.now()}${ext}`;
      const filePath = path.join(uploadsDir, safeFileName);

      const bytes = await file.arrayBuffer();
      await writeFile(filePath, Buffer.from(bytes));

      paymentProofFile = `/api/uploads/payment-proofs/${safeFileName}`;
    }
  } catch {
    // If formData parsing fails (e.g. no body), continue without file
  }

  // Update ExecutorRequest
  await prisma.executorRequest.update({
    where: { id: execReq.id },
    data: {
      status: "client_paid",
      clientPaidAt: new Date(),
      ...(paymentProofFile ? { paymentProofFile } : {}),
    },
  });

  // Update Request status
  await prisma.request.update({
    where: { id: execReq.requestId },
    data: { status: "review" },
  });

  // Emit Socket.IO events
  const io = getIO();
  if (io) {
    io.emit("request-update", {
      id: execReq.requestId,
      status: "review",
    });
    io.to("admin").emit("client-payment-received", {
      requestId: execReq.requestId,
      executorName: execReq.executor.name,
      clientAmount: execReq.clientAmount,
      service: execReq.request.service,
      clientName: execReq.request.name,
    });
  }

  return NextResponse.json({ success: true });
}
