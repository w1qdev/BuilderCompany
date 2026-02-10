import { verifyAdminPassword } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { createRateLimiter } from "@/lib/rateLimit";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

const passwordLimiter = createRateLimiter({ max: 3, windowMs: 15 * 60 * 1000 });

export async function POST(req: NextRequest) {
  if (!passwordLimiter(req)) {
    return NextResponse.json(
      { error: "Слишком много попыток. Попробуйте через 15 минут" },
      { status: 429 },
    );
  }

  const headerPassword = req.headers.get("x-admin-password");
  if (!headerPassword || !(await verifyAdminPassword(headerPassword))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { newPassword } = await req.json();
  if (!newPassword || newPassword.length < 4) {
    return NextResponse.json(
      { error: "Пароль должен быть не менее 4 символов" },
      { status: 400 },
    );
  }

  const hash = await bcrypt.hash(newPassword, 16);
  await prisma.setting.upsert({
    where: { key: "adminPassword" },
    update: { value: hash },
    create: { key: "adminPassword", value: hash },
  });

  return NextResponse.json({ ok: true });
}
