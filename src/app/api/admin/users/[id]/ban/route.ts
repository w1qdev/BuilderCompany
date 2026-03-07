import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminPassword } from "@/lib/adminAuth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const headerPassword = request.headers.get("x-admin-password") || "";
  if (!headerPassword || !(await verifyAdminPassword(headerPassword))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id: Number(id) } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.user.update({
    where: { id: Number(id) },
    data: { banned: !user.banned },
  });

  if (updated.banned) {
    await prisma.userSession.updateMany({
      where: { userId: Number(id) },
      data: { revoked: true },
    });
  }

  return NextResponse.json({ banned: updated.banned });
}
