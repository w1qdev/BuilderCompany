import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const withSubTypes = searchParams.get("withSubTypes") === "true";
  const typeId = searchParams.get("typeId");

  // If typeId is provided, return sub-types for that equipment type
  if (typeId) {
    const subTypes = await prisma.equipmentSubType.findMany({
      where: { equipmentTypeId: parseInt(typeId) },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
    return NextResponse.json({ subTypes });
  }

  const types = await prisma.equipmentType.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      category: true,
      ...(withSubTypes && {
        subTypes: {
          orderBy: { name: "asc" as const },
          select: { id: true, name: true },
        },
      }),
    },
  });

  return NextResponse.json({ types });
}
