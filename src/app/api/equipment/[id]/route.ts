import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { logActivity } from "@/lib/activityLog";
import { createRateLimiter } from "@/lib/rateLimit";
import { calculateEquipmentStatus } from "@/lib/equipmentStatus";

const equipmentWriteLimiter = createRateLimiter({ max: 30, windowMs: 60 * 1000 });

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    if (!equipmentWriteLimiter(request, userId)) {
      return NextResponse.json({ error: "Слишком много запросов" }, { status: 429 });
    }

    const { id } = await params;
    const equipmentId = parseInt(id);

    const { canAccessOrgEquipment } = await import("@/lib/orgAccess");
    if (!(await canAccessOrgEquipment(userId, equipmentId))) {
      return NextResponse.json({ error: "Оборудование не найдено" }, { status: 404 });
    }
    const existing = await prisma.equipment.findUnique({
      where: { id: equipmentId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Оборудование не найдено" }, { status: 404 });
    }

    const body = await request.json();
    const { name, type, serialNumber, verificationDate, nextVerification, interval, category, company, contactEmail, notes, arshinUrl, ignored, pinned } = body;

    // If only toggling ignored or pinned, do a quick update and return
    if (ignored !== undefined && Object.keys(body).length === 1) {
      const updated = await prisma.equipment.update({
        where: { id: equipmentId },
        data: { ignored },
      });
      return NextResponse.json(updated);
    }
    if (pinned !== undefined && Object.keys(body).length === 1) {
      const updated = await prisma.equipment.update({
        where: { id: equipmentId },
        data: { pinned },
      });
      return NextResponse.json(updated);
    }

    // Recalculate status
    const status = calculateEquipmentStatus(nextVerification || existing.nextVerification);

    // Reset notified flag only when nextVerification date changes
    const shouldResetNotified = nextVerification !== undefined &&
      String(nextVerification) !== String(existing.nextVerification?.toISOString().split("T")[0] ?? "");

    const updated = await prisma.equipment.update({
      where: { id: equipmentId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(type !== undefined && { type: type?.trim() || null }),
        ...(serialNumber !== undefined && { serialNumber: serialNumber?.trim() || null }),
        ...(verificationDate !== undefined && { verificationDate: verificationDate ? new Date(verificationDate) : null }),
        ...(nextVerification !== undefined && { nextVerification: nextVerification ? new Date(nextVerification) : null }),
        ...(interval !== undefined && { interval }),
        ...(category !== undefined && { category }),
        ...(company !== undefined && { company: company?.trim() || null }),
        ...(contactEmail !== undefined && { contactEmail: contactEmail?.trim() || null }),
        ...(notes !== undefined && { notes: notes?.trim() || null }),
        ...(arshinUrl !== undefined && { arshinUrl: arshinUrl?.trim() || null }),
        status,
        ...(shouldResetNotified && { notified: false }),
      },
    });

    // Auto-create verification record when verificationDate changes
    if (verificationDate !== undefined && verificationDate !== (existing.verificationDate?.toISOString().split("T")[0] ?? "")) {
      prisma.verificationRecord.create({
        data: {
          equipmentId,
          date: new Date(verificationDate),
          nextDate: nextVerification ? new Date(nextVerification) : (existing.nextVerification ?? null),
          performer: company || existing.company || null,
          notes: "Обновлено через редактирование",
        },
      }).catch(e => console.error("Failed to create verification record:", e));
    }

    logActivity({ userId, action: "equipment_updated", entityType: "equipment", entityId: equipmentId, details: JSON.stringify({ name: updated.name }) });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update equipment error:", error);
    return NextResponse.json({ error: "Ошибка при обновлении" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { id } = await params;
    const equipmentId = parseInt(id);

    const { canAccessOrgEquipment } = await import("@/lib/orgAccess");
    if (!(await canAccessOrgEquipment(userId, equipmentId))) {
      return NextResponse.json({ error: "Оборудование не найдено" }, { status: 404 });
    }
    const existing = await prisma.equipment.findUnique({
      where: { id: equipmentId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Оборудование не найдено" }, { status: 404 });
    }

    await prisma.equipment.delete({ where: { id: equipmentId } });

    logActivity({ userId, action: "equipment_deleted", entityType: "equipment", entityId: equipmentId, details: JSON.stringify({ name: existing.name }) });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete equipment error:", error);
    return NextResponse.json({ error: "Ошибка при удалении" }, { status: 500 });
  }
}
