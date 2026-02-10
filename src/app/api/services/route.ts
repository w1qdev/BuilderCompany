import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const priceFilter = searchParams.get("priceFilter");

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = { isActive: true };

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (priceFilter && priceFilter !== "all") {
      if (priceFilter === "cheap") {
        where.price = { lt: 5000 };
      } else if (priceFilter === "medium") {
        where.price = { gte: 5000, lt: 20000 };
      } else if (priceFilter === "expensive") {
        where.price = { gte: 20000 };
      }
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
    console.error("Services fetch error:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки услуг" },
      { status: 500 }
    );
  }
}
