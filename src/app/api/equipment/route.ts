import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { logActivity } from "@/lib/activityLog";
import { createRateLimiter } from "@/lib/rateLimit";
import { equipmentCreateSchema, validate } from "@/lib/validation";
import { calculateEquipmentStatus } from "@/lib/equipmentStatus";

export const dynamic = "force-dynamic";

const equipmentReadLimiter = createRateLimiter({ max: 120, windowMs: 60 * 1000 });
const equipmentWriteLimiter = createRateLimiter({ max: 30, windowMs: 60 * 1000 });

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    if (!equipmentReadLimiter(request, userId)) {
      return NextResponse.json({ error: "Слишком много запросов" }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 10000);
    const skip = (page - 1) * limit;
    const search = (searchParams.get("search") || "").slice(0, 100);
    const status = searchParams.get("status") || "";
    const categoryParams = searchParams.getAll("category");

    const showIgnored = searchParams.get("ignored") === "true";
    const orgId = searchParams.get("organizationId");

    // If orgId provided, check membership and show org equipment
    let where: Record<string, unknown>;
    if (orgId) {
      const membership = await prisma.organizationMember.findUnique({
        where: { userId_organizationId: { userId, organizationId: Number(orgId) } },
      });
      if (!membership) {
        return NextResponse.json({ error: "Нет доступа к организации" }, { status: 403 });
      }
      where = { organizationId: Number(orgId), ignored: showIgnored };
    } else {
      where = { userId, organizationId: null, ignored: showIgnored };
    }
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
        include: {
          requestItems: {
            take: 1,
            orderBy: { id: "desc" },
            select: {
              id: true,
              request: { select: { id: true, status: true, createdAt: true } },
            },
          },
        },
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
    if (!equipmentWriteLimiter(request, userId)) {
      return NextResponse.json({ error: "Слишком много запросов" }, { status: 429 });
    }

    const body = await request.json();
    const parsed = validate(equipmentCreateSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const { name, type, serialNumber, registryNumber, verificationDate, nextVerification, interval, category, company, contactEmail, notes, arshinUrl } = parsed.data;

    // Calculate status based on nextVerification date
    const status = calculateEquipmentStatus(nextVerification);

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

    logActivity({ userId, action: "equipment_added", entityType: "equipment", entityId: equipment.id, details: JSON.stringify({ name: equipment.name }) });

    return NextResponse.json(equipment, { status: 201 });
  } catch (error) {
    console.error("Create equipment error:", error);
    return NextResponse.json({ error: "Ошибка при создании записи" }, { status: 500 });
  }
}
