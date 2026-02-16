import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import { JWT_SECRET } from "@/lib/jwt";

export const dynamic = "force-dynamic";

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

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 500);
    const skip = (page - 1) * limit;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const categoryParams = searchParams.getAll("category");

    const where: Record<string, unknown> = { userId };
    if (status) where.status = status;
    if (categoryParams.length === 1) {
      where.category = categoryParams[0];
    } else if (categoryParams.length > 1) {
      where.category = { in: categoryParams };
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { type: { contains: search } },
        { serialNumber: { contains: search } },
        { registryNumber: { contains: search } },
      ];
    }

    const [equipment, total] = await Promise.all([
      prisma.equipment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.equipment.count({ where }),
    ]);

    return NextResponse.json({ equipment, total, page, limit });
  } catch (error) {
    console.error("Get equipment error:", error);
    return NextResponse.json({ error: "Ошибка при получении оборудования" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const body = await request.json();
    const { name, type, serialNumber, registryNumber, verificationDate, nextVerification, interval, category, company, contactEmail, notes, arshinUrl } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Наименование обязательно" }, { status: 400 });
    }

    // Calculate status based on nextVerification date
    let status = "active";
    if (nextVerification) {
      const nextDate = new Date(nextVerification);
      const now = new Date();
      const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      if (nextDate < now) status = "expired";
      else if (nextDate < twoWeeks) status = "pending";
    }

    const equipment = await prisma.equipment.create({
      data: {
        userId,
        name: name.trim(),
        type: type?.trim() || null,
        serialNumber: serialNumber?.trim() || null,
        registryNumber: registryNumber?.trim() || null,
        verificationDate: verificationDate ? new Date(verificationDate) : null,
        nextVerification: nextVerification ? new Date(nextVerification) : null,
        interval: interval || 12,
        category: category || "verification",
        status,
        company: company?.trim() || null,
        contactEmail: contactEmail?.trim() || null,
        notes: notes?.trim() || null,
        arshinUrl: arshinUrl?.trim() || null,
      },
    });

    return NextResponse.json(equipment, { status: 201 });
  } catch (error) {
    console.error("Create equipment error:", error);
    return NextResponse.json({ error: "Ошибка при создании записи" }, { status: 500 });
  }
}
