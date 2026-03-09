import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminAuth } from "@/lib/adminAuth";
import * as XLSX from "xlsx";

export async function POST(req: NextRequest) {
  const auth = await verifyAdminAuth(req);
  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) {
    return NextResponse.json({ error: "Файл не загружен" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);

  let created = 0;
  let skipped = 0;

  for (const row of rows) {
    const name = (row["Название"] || row["name"] || "").toString().trim();
    const email = (row["Email"] || row["email"] || "").toString().trim();
    if (!name || !email) {
      skipped++;
      continue;
    }

    const servicesRaw = (row["Услуги"] || row["services"] || "").toString().trim();
    const services = servicesRaw
      ? JSON.stringify(servicesRaw.split(",").map((s: string) => s.trim()).filter(Boolean))
      : "[]";

    try {
      await prisma.executor.create({
        data: {
          name,
          email,
          inn: (row["ИНН"] || row["inn"] || "").toString().trim() || null,
          phone: (row["Телефон"] || row["phone"] || "").toString().trim() || null,
          address: (row["Адрес"] || row["address"] || "").toString().trim() || null,
          services,
          accreditationNumber: (row["Аккредитация"] || row["accreditation"] || "").toString().trim() || null,
        },
      });
      created++;
    } catch {
      skipped++;
    }
  }

  return NextResponse.json({ created, skipped, total: rows.length });
}
