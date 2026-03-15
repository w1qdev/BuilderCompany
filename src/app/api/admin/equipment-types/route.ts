import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminAuth } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await verifyAdminAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const types = await prisma.equipmentType.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          specializations: true,
          requestItems: true,
        },
      },
    },
  });

  return NextResponse.json({ types });
}

export async function POST(req: NextRequest) {
  const auth = await verifyAdminAuth(req);
  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, category } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Название обязательно" }, { status: 400 });
    }

    const existing = await prisma.equipmentType.findUnique({
      where: { name: name.trim() },
    });
    if (existing) {
      return NextResponse.json({ error: "Такой тип уже существует" }, { status: 409 });
    }

    const type = await prisma.equipmentType.create({
      data: {
        name: name.trim(),
        category: category?.trim() || null,
      },
      include: {
        _count: {
          select: { specializations: true, requestItems: true },
        },
      },
    });

    return NextResponse.json({ type }, { status: 201 });
  } catch (error) {
    console.error("Error creating equipment type:", error);
    return NextResponse.json({ error: "Ошибка создания типа оборудования" }, { status: 500 });
  }
}
