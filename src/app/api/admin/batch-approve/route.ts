import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminAuth } from "@/lib/adminAuth";
import { sendExecutorEmail } from "@/lib/executorEmail";
import { getIO } from "@/lib/socket";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await verifyAdminAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { approvals } = await req.json();

  if (!Array.isArray(approvals) || approvals.length === 0) {
    return NextResponse.json({ error: "approvals array required" }, { status: 400 });
  }

  const results: { execReqId: number; success: boolean; error?: string }[] = [];

  for (const execReqId of approvals) {
    try {
      const execReq = await prisma.executorRequest.findUnique({
        where: { id: Number(execReqId) },
        include: {
          request: { include: { items: true, files: true } },
          executor: true,
        },
      });

      if (!execReq || execReq.status !== "pending_approval") {
        results.push({ execReqId, success: false, error: "Not found or not pending" });
        continue;
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
        executorName: execReq.executor.name,
        executorEmail: execReq.executor.email,
        requestId: request.id,
        executorRequestId: execReq.id,
        clientCompany: request.company || request.name,
        clientInn: request.inn || undefined,
        items,
        message: request.message || undefined,
        files: request.files?.map((f: { fileName: string; filePath: string }) => ({ fileName: f.fileName, filePath: f.filePath })),
      });

      await prisma.executorRequest.update({
        where: { id: execReq.id },
        data: {
          status: "awaiting_response",
          sentAt: new Date(),
          ...(messageId ? { emailMessageId: messageId } : {}),
        },
      });

      // Auto-advance request status
      if (request.status === "new") {
        await prisma.request.update({
          where: { id: request.id },
          data: { status: "in_progress" },
        });
      }

      const io = getIO();
      if (io) {
        io.emit("request-update", { id: request.id, status: "in_progress" });
        if (request.userId) {
          io.to(`user:${request.userId}`).emit("request-status-changed", {
            requestId: request.id,
            status: "in_progress",
          });
        }
      }

      results.push({ execReqId, success: true });
    } catch (err) {
      console.error(`Batch approve error for ${execReqId}:`, err);
      results.push({ execReqId, success: false, error: "Internal error" });
    }
  }

  return NextResponse.json({
    total: approvals.length,
    success: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    results,
  });
}
