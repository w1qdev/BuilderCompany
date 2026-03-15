import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const types = await prisma.equipmentType.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, category: true },
  });

  return NextResponse.json({ types });
}
