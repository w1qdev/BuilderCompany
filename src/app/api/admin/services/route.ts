import { verifyAdminPassword } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// GET all services (admin)
export async function GET(req: NextRequest) {
  try {
    const password = req.headers.get("x-admin-password");
    if (!password) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const isValid = await verifyAdminPassword(password);

    if (!isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search");
    const category = searchParams.get("category");

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (category && category !== "all") {
      where.category = category;
    }

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.service.count({ where }),
    ]);

    return NextResponse.json({
      services,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Admin services fetch error:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки услуг" },
      { status: 500 }
    );
  }
}

// POST create service (admin)
export async function POST(req: NextRequest) {
  try {
    const password = req.headers.get("x-admin-password");
    if (!password) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const isValid = await verifyAdminPassword(password);

    if (!isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, price, image, category, isActive } = body;

    if (!title || !description || !price || !category) {
      return NextResponse.json(
        { error: "Заполните все обязательные поля" },
        { status: 400 }
      );
    }

    const service = await prisma.service.create({
      data: {
        title,
        description,
        price: parseInt(price),
        image: image || null,
        category,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(service);
  } catch (error) {
    console.error("Service creation error:", error);
    return NextResponse.json(
      { error: "Ошибка создания услуги" },
      { status: 500 }
    );
  }
}
