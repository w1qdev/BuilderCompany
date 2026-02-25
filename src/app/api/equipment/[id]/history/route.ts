import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";

export async function GET(
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

    const records = await prisma.verificationRecord.findMany({
      where: { equipmentId },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ records });
  } catch (error) {
    console.error("Get verification history error:", error);
    return NextResponse.json({ error: "Ошибка при получении истории" }, { status: 500 });
  }
}

export async function POST(
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
    const { date, nextDate, result, performer, certificate, notes } = body;

    if (!date) {
      return NextResponse.json({ error: "Дата поверки обязательна" }, { status: 400 });
    }

    const record = await prisma.verificationRecord.create({
      data: {
        equipmentId,
        date: new Date(date),
        nextDate: nextDate ? new Date(nextDate) : null,
        result: result?.trim() || null,
        performer: performer?.trim() || null,
        certificate: certificate?.trim() || null,
        notes: notes?.trim() || null,
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("Create verification record error:", error);
    return NextResponse.json({ error: "Ошибка при создании записи" }, { status: 500 });
  }
}
