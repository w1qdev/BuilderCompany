import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminPassword } from "@/lib/adminAuth";

export const dynamic = 'force-dynamic';

const BOOL_KEYS = ["emailNotifyAdmin", "emailNotifyCustomer", "telegramNotify", "maxNotify"];
const STRING_KEYS = ["notifyEmail", "companyPhone", "companyEmail", "companyAddress"];

export async function GET(req: NextRequest) {
  const headerPassword = req.headers.get("x-admin-password");
  if (!headerPassword || !(await verifyAdminPassword(headerPassword))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.setting.findMany({
    where: { key: { in: [...BOOL_KEYS, ...STRING_KEYS] } },
  });

  const result: Record<string, string | boolean> = {};
  for (const key of BOOL_KEYS) {
    const row = rows.find((r) => r.key === key);
    result[key] = row ? row.value === "true" : true;
  }
  for (const key of STRING_KEYS) {
    const row = rows.find((r) => r.key === key);
    result[key] = row?.value || "";
  }

  return NextResponse.json(result);
}

export async function PUT(req: NextRequest) {
  const headerPassword = req.headers.get("x-admin-password");
  if (!headerPassword || !(await verifyAdminPassword(headerPassword))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  await Promise.all([
    ...BOOL_KEYS.map((key) =>
      prisma.setting.upsert({
        where: { key },
        update: { value: String(body[key] === true) },
        create: { key, value: String(body[key] === true) },
      })
    ),
    ...STRING_KEYS.map((key) =>
      prisma.setting.upsert({
        where: { key },
        update: { value: String(body[key] || "") },
        create: { key, value: String(body[key] || "") },
      })
    ),
  ]);

  return NextResponse.json({ ok: true });
}
