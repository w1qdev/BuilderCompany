import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Light endpoint for mini-calendar widget.
 * Returns only id, name, type, nextVerification for equipment with dates set.
 */
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  try {
    const equipment = await prisma.equipment.findMany({
      where: {
        userId,
        ignored: false,
        nextVerification: { not: null },
      },
      select: {
        id: true,
        name: true,
        type: true,
        nextVerification: true,
      },
      orderBy: { nextVerification: "asc" },
    });

    return NextResponse.json({ equipment });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
