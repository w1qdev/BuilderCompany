import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminAuth } from "@/lib/adminAuth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminAuth(req);
  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const executorId = parseInt(id, 10);
  if (isNaN(executorId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const data: Record<string, unknown> = {};

    if (body.name !== undefined) data.name = body.name.trim();
    if (body.email !== undefined) data.email = body.email.trim();
    if (body.inn !== undefined) data.inn = body.inn?.trim() || null;
    if (body.phone !== undefined) data.phone = body.phone?.trim() || null;
    if (body.address !== undefined) data.address = body.address?.trim() || null;
    if (body.website !== undefined) data.website = body.website?.trim() || null;
    if (body.accreditationNumber !== undefined) data.accreditationNumber = body.accreditationNumber?.trim() || null;
    if (body.notes !== undefined) data.notes = body.notes?.trim() || null;
    if (body.active !== undefined) data.active = Boolean(body.active);

    if (body.services !== undefined) {
      const services = body.services;
      if (Array.isArray(services)) {
        data.services = JSON.stringify(services.map((s: string) => s.trim()).filter(Boolean));
      } else if (typeof services === "string") {
        try {
          const parsed = JSON.parse(services);
          if (Array.isArray(parsed)) {
            data.services = JSON.stringify(parsed.map((s: string) => String(s).trim()).filter(Boolean));
          } else {
            data.services = JSON.stringify([services.trim()].filter(Boolean));
          }
        } catch {
          data.services = JSON.stringify(
            services.split(",").map((s: string) => s.trim()).filter(Boolean)
          );
        }
      }
    }

    const executor = await prisma.executor.update({
      where: { id: executorId },
      data,
      include: { _count: { select: { executorRequests: true } } },
    });

    return NextResponse.json({ executor });
  } catch (error) {
    console.error("Error updating executor:", error);
    return NextResponse.json({ error: "Ошибка обновления исполнителя" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminAuth(req);
  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const executorId = parseInt(id, 10);
  if (isNaN(executorId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    await prisma.executor.delete({ where: { id: executorId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting executor:", error);
    return NextResponse.json({ error: "Ошибка удаления исполнителя" }, { status: 500 });
  }
}
