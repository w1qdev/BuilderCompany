import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminAuth } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await verifyAdminAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get admin's last dispatch view timestamp
  const lastViewSetting = await prisma.setting.findUnique({
    where: { key: "adminLastDispatchView" },
  });
  const lastView = lastViewSetting?.value ? new Date(lastViewSetting.value) : new Date(0);

  // 1. Pending approval (semi-auto mode)
  const pendingApproval = await prisma.executorRequest.findMany({
    where: { status: "pending_approval" },
    include: {
      request: { include: { items: true } },
      executor: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // 2. Auto-sent since last view
  const autoSent = await prisma.executorRequest.findMany({
    where: {
      status: "awaiting_response",
      sentAt: { gt: lastView },
    },
    include: {
      request: { select: { id: true, service: true, company: true, name: true } },
      executor: { select: { id: true, name: true } },
    },
    orderBy: { sentAt: "desc" },
  });

  // 3. Requests with no executor match (new requests without any ExecutorRequest)
  const noExecutor = await prisma.request.findMany({
    where: {
      status: "new",
      executorRequests: { none: {} },
      createdAt: { gt: lastView },
    },
    select: { id: true, service: true, company: true, name: true },
    orderBy: { createdAt: "desc" },
  });

  // Update last dispatch view timestamp
  await prisma.setting.upsert({
    where: { key: "adminLastDispatchView" },
    update: { value: new Date().toISOString() },
    create: { key: "adminLastDispatchView", value: new Date().toISOString() },
  });

  return NextResponse.json({
    pendingApproval: pendingApproval.map((er) => ({
      execReqId: er.id,
      request: {
        id: er.request.id,
        service: er.request.service,
        company: er.request.company || er.request.name,
        items: er.request.items,
      },
      executor: er.executor,
      suggestedSubject: `Заявка на поверку [CSM-${er.request.id}-${er.id}] — ${er.request.company || er.request.name}`,
    })),
    autoSent: autoSent.map((er) => ({
      requestId: er.request.id,
      service: er.request.service,
      company: er.request.company || er.request.name,
      executorName: er.executor.name,
      sentAt: er.sentAt,
    })),
    noExecutor: noExecutor.map((r) => ({
      requestId: r.id,
      service: r.service,
      company: r.company || r.name,
    })),
  });
}
