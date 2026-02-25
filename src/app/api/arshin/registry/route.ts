import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { JWT_SECRET } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;
    if (!token) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as number;

    // Get user's equipment that has Arshin data (already fetched by arshin-check)
    const equipment = await prisma.equipment.findMany({
      where: {
        userId,
        category: { in: ["verification", "calibration"] },
        arshinCheckedAt: { not: null },
      },
      select: {
        id: true,
        name: true,
        type: true,
        serialNumber: true,
        registryNumber: true,
        verificationDate: true,
        arshinValidDate: true,
        arshinUrl: true,
        arshinCheckedAt: true,
      },
      orderBy: { arshinValidDate: "desc" },
    });

    const now = new Date();

    const items = equipment
      .filter((eq) => eq.arshinValidDate || eq.arshinUrl)
      .map((eq) => ({
        equipmentId: eq.id,
        equipmentName: eq.name,
        serialNumber: eq.serialNumber,
        registryNumber: eq.registryNumber,
        miName: eq.name,
        miType: eq.type || "",
        miSerialNumber: eq.serialNumber || "",
        miRegistryNumber: eq.registryNumber || "",
        orgTitle: "",
        vriDate: eq.verificationDate ? eq.verificationDate.toISOString() : "",
        validDate: eq.arshinValidDate ? eq.arshinValidDate.toISOString() : "",
        arshinUrl: eq.arshinUrl || "",
        isExpired: eq.arshinValidDate ? eq.arshinValidDate < now : false,
      }));

    return NextResponse.json({ items, total: items.length });
  } catch (e) {
    console.error("Arshin registry error:", e);
    return NextResponse.json({ error: "Ошибка запроса" }, { status: 500 });
  }
}
