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
  const typeId = parseInt(id, 10);
  if (isNaN(typeId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const data: Record<string, unknown> = {};

    if (body.name !== undefined) {
      const name = body.name.trim();
      if (!name) {
        return NextResponse.json({ error: "Название обязательно" }, { status: 400 });
      }
      const existing = await prisma.equipmentType.findFirst({
        where: { name, id: { not: typeId } },
      });
      if (existing) {
        return NextResponse.json({ error: "Такой тип уже существует" }, { status: 409 });
      }
      data.name = name;
    }

    if (body.category !== undefined) {
      data.category = body.category?.trim() || null;
    }

    const type = await prisma.equipmentType.update({
      where: { id: typeId },
      data,
      include: {
        _count: { select: { specializations: true, requestItems: true } },
      },
    });

    return NextResponse.json({ type });
  } catch (error) {
    console.error("Error updating equipment type:", error);
    return NextResponse.json({ error: "Ошибка обновления" }, { status: 500 });
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
  const typeId = parseInt(id, 10);
  if (isNaN(typeId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    // Check if referenced by specializations or request items
    const refs = await prisma.equipmentType.findUnique({
      where: { id: typeId },
      include: {
        _count: { select: { specializations: true, requestItems: true } },
      },
    });

    if (!refs) {
      return NextResponse.json({ error: "Тип не найден" }, { status: 404 });
    }

    if (refs._count.specializations > 0 || refs._count.requestItems > 0) {
      return NextResponse.json(
        {
          error: `Невозможно удалить: используется в ${refs._count.specializations} специализациях и ${refs._count.requestItems} позициях заявок`,
        },
        { status: 409 }
      );
    }

    await prisma.equipmentType.delete({ where: { id: typeId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting equipment type:", error);
    return NextResponse.json({ error: "Ошибка удаления" }, { status: 500 });
  }
}
