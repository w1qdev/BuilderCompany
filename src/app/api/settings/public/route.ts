import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

const DEFAULTS: Record<string, string> = {
  companyPhone: "+7 (966) 730-30-03",
  companyEmail: "zakaz@csm-center.ru",
  companyAddress: "г. Москва, ул. Метрологическая, д. 10, офис 205",
};

export async function GET() {
  const keys = Object.keys(DEFAULTS);
  const rows = await prisma.setting.findMany({
    where: { key: { in: keys } },
  });

  const result: Record<string, string> = { ...DEFAULTS };
  for (const row of rows) {
    if (row.value) result[row.key] = row.value;
  }

  return NextResponse.json({
    phone: result.companyPhone,
    email: result.companyEmail,
    address: result.companyAddress,
  });
}
