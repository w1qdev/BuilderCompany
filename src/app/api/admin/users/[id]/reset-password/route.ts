import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminPassword } from "@/lib/adminAuth";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const headerPassword = request.headers.get("x-admin-password") || "";
  if (!headerPassword || !(await verifyAdminPassword(headerPassword))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const newPassword = crypto.randomBytes(6).toString("hex");
  const hashed = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: Number(id) },
    data: { password: hashed },
  });

  await prisma.userSession.updateMany({
    where: { userId: Number(id) },
    data: { revoked: true },
  });

  return NextResponse.json({ newPassword });
}
