import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { organizationCreateSchema, validate } from "@/lib/validation";

export const dynamic = "force-dynamic";

// GET /api/organizations — list user's organizations
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const memberships = await prisma.organizationMember.findMany({
      where: { userId },
      include: {
        organization: {
          include: {
            members: {
              include: { user: { select: { id: true, name: true, email: true } } },
            },
            _count: { select: { equipment: true } },
          },
        },
      },
    });

    const organizations = memberships.map((m) => ({
      ...m.organization,
      role: m.role,
      equipmentCount: m.organization._count.equipment,
    }));

    return NextResponse.json({ organizations });
  } catch (error) {
    console.error("Get organizations error:", error);
    return NextResponse.json({ error: "Ошибка" }, { status: 500 });
  }
}

// POST /api/organizations — create organization
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = validate(organizationCreateSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const { name, inn, kpp, address } = parsed.data;

    const org = await prisma.organization.create({
      data: {
        name: name.trim(),
        inn: inn || null,
        kpp: kpp || null,
        address: address || null,
        members: {
          create: { userId, role: "admin" },
        },
      },
      include: { members: true },
    });

    return NextResponse.json({ organization: org });
  } catch (error) {
    console.error("Create organization error:", error);
    return NextResponse.json({ error: "Ошибка при создании организации" }, { status: 500 });
  }
}
