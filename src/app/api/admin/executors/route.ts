import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminAuth } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await verifyAdminAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const executors = await prisma.executor.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { executorRequests: true } },
      specializations: {
        include: { equipmentType: { select: { id: true, name: true, category: true } } },
        orderBy: { serviceType: "asc" },
      },
    },
  });

  return NextResponse.json({ executors });
}

export async function POST(req: NextRequest) {
  const auth = await verifyAdminAuth(req);
  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, email, inn, phone, address, website, services, accreditationNumber, notes } = body;

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: "Название и email обязательны" }, { status: 400 });
    }

    // Normalize services: accept array or comma-separated string → JSON string
    let servicesJson = "[]";
    if (services) {
      if (Array.isArray(services)) {
        servicesJson = JSON.stringify(services.map((s: string) => s.trim()).filter(Boolean));
      } else if (typeof services === "string") {
        try {
          // Try parsing as JSON first
          const parsed = JSON.parse(services);
          if (Array.isArray(parsed)) {
            servicesJson = JSON.stringify(parsed.map((s: string) => String(s).trim()).filter(Boolean));
          } else {
            servicesJson = JSON.stringify([services.trim()].filter(Boolean));
          }
        } catch {
          // Treat as comma-separated
          servicesJson = JSON.stringify(
            services.split(",").map((s: string) => s.trim()).filter(Boolean)
          );
        }
      }
    }

    const specializations = body.specializations as
      | { serviceType: string; equipmentTypeId: number }[]
      | undefined;

    const executor = await prisma.executor.create({
      data: {
        name: name.trim(),
        email: email.trim(),
        inn: inn?.trim() || null,
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        website: website?.trim() || null,
        services: servicesJson,
        accreditationNumber: accreditationNumber?.trim() || null,
        notes: notes?.trim() || null,
        ...(specializations?.length
          ? {
              specializations: {
                create: specializations.map((s) => ({
                  serviceType: s.serviceType,
                  equipmentTypeId: s.equipmentTypeId,
                })),
              },
            }
          : {}),
      },
      include: {
        _count: { select: { executorRequests: true } },
        specializations: {
          include: { equipmentType: { select: { id: true, name: true, category: true } } },
          orderBy: { serviceType: "asc" },
        },
      },
    });

    return NextResponse.json({ executor }, { status: 201 });
  } catch (error) {
    console.error("Error creating executor:", error);
    return NextResponse.json({ error: "Ошибка создания исполнителя" }, { status: 500 });
  }
}
