import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import { JWT_SECRET } from "@/lib/jwt";

async function getUserId(request: NextRequest): Promise<number | null> {
  const token = request.cookies.get("auth-token")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.userId as number;
  } catch {
    return null;
  }
}

export async function PATCH(
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

    const existing = await prisma.equipment.findFirst({
      where: { id: equipmentId, userId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Оборудование не найдено" }, { status: 404 });
    }

    const body = await request.json();
    const { name, type, serialNumber, registryNumber, verificationDate, nextVerification, interval, category, company, contactEmail, notes } = body;

    // Recalculate status
    const nextDate = nextVerification ? new Date(nextVerification) : existing.nextVerification;
    let status = "active";
    if (nextDate) {
      const now = new Date();
      const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      if (nextDate < now) status = "expired";
      else if (nextDate < twoWeeks) status = "pending";
    }

    const updated = await prisma.equipment.update({
      where: { id: equipmentId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(type !== undefined && { type: type?.trim() || null }),
        ...(serialNumber !== undefined && { serialNumber: serialNumber?.trim() || null }),
        ...(registryNumber !== undefined && { registryNumber: registryNumber?.trim() || null }),
        ...(verificationDate !== undefined && { verificationDate: verificationDate ? new Date(verificationDate) : null }),
        ...(nextVerification !== undefined && { nextVerification: nextVerification ? new Date(nextVerification) : null }),
        ...(interval !== undefined && { interval }),
        ...(category !== undefined && { category }),
        ...(company !== undefined && { company: company?.trim() || null }),
        ...(contactEmail !== undefined && { contactEmail: contactEmail?.trim() || null }),
        ...(notes !== undefined && { notes: notes?.trim() || null }),
        status,
        notified: false,
      },
    });

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

    const existing = await prisma.equipment.findFirst({
      where: { id: equipmentId, userId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Оборудование не найдено" }, { status: 404 });
    }

    await prisma.equipment.delete({ where: { id: equipmentId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete equipment error:", error);
    return NextResponse.json({ error: "Ошибка при удалении" }, { status: 500 });
  }
}
