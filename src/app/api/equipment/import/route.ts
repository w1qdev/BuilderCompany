import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import { JWT_SECRET } from "@/lib/jwt";
import * as ExcelJS from "exceljs";

async function getUserId(request: NextRequest): Promise<number | null> {
  const token = request.cookies.get("auth-token")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.userId as number;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "Файл не загружен" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await workbook.xlsx.load(arrayBuffer as any);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return NextResponse.json({ error: "Пустой файл" }, { status: 400 });
    }

    const items: {
      name: string;
      type: string | null;
      serialNumber: string | null;
      registryNumber: string | null;
      category: string;
      interval: number;
      company: string | null;
    }[] = [];

    // Try to find header row (look for "наименование" in first 5 rows)
    let headerRowIndex = 1;
    let nameCol = -1;
    let typeCol = -1;
    let serialCol = -1;
    let registryCol = -1;
    let categoryCol = -1;
    let intervalCol = -1;
    let companyCol = -1;

    for (let r = 1; r <= Math.min(5, worksheet.rowCount); r++) {
      const row = worksheet.getRow(r);
      row.eachCell((cell, colNumber) => {
        const val = String(cell.value || "").toLowerCase();
        if (val.includes("наименование") || val.includes("название") || val.includes("оборудование")) {
          nameCol = colNumber;
          headerRowIndex = r;
        }
        if (val.includes("тип") || val.includes("модель")) typeCol = colNumber;
        if (val.includes("заводской") || val.includes("серийный") || val.includes("зав")) serialCol = colNumber;
        if (val.includes("реестр")) registryCol = colNumber;
        if (val.includes("категори") || val.includes("вид")) categoryCol = colNumber;
        if (val.includes("интервал") || val.includes("период")) intervalCol = colNumber;
        if (val.includes("фирма") || val.includes("организ") || val.includes("компани")) companyCol = colNumber;
      });
      if (nameCol > 0) break;
    }

    // If no header found, assume columns: A=name, B=type, C=serialNumber, D=registryNumber
    if (nameCol < 0) {
      nameCol = 1;
      typeCol = 2;
      serialCol = 3;
      registryCol = 4;
      headerRowIndex = 0; // Start from row 1
    }

    for (let r = headerRowIndex + 1; r <= worksheet.rowCount; r++) {
      const row = worksheet.getRow(r);
      const name = String(row.getCell(nameCol).value || "").trim();
      if (!name) continue;

      const catVal = categoryCol > 0 ? String(row.getCell(categoryCol).value || "").toLowerCase() : "";
      let category = "verification";
      if (catVal.includes("калибров")) category = "calibration";
      else if (catVal.includes("аттестац")) category = "attestation";

      const intervalVal = intervalCol > 0 ? Number(row.getCell(intervalCol).value) : 12;

      items.push({
        name,
        type: typeCol > 0 ? String(row.getCell(typeCol).value || "").trim() || null : null,
        serialNumber: serialCol > 0 ? String(row.getCell(serialCol).value || "").trim() || null : null,
        registryNumber: registryCol > 0 ? String(row.getCell(registryCol).value || "").trim() || null : null,
        category,
        interval: intervalVal && !isNaN(intervalVal) ? intervalVal : 12,
        company: companyCol > 0 ? String(row.getCell(companyCol).value || "").trim() || null : null,
      });
    }

    if (items.length === 0) {
      return NextResponse.json({ error: "Не найдено записей в файле" }, { status: 400 });
    }

    // Create all equipment records
    const created = await prisma.$transaction(
      items.map((item) =>
        prisma.equipment.create({
          data: {
            userId,
            name: item.name,
            type: item.type,
            serialNumber: item.serialNumber,
            registryNumber: item.registryNumber,
            category: item.category,
            interval: item.interval,
            company: item.company,
            status: "active",
          },
        })
      )
    );

    return NextResponse.json({ imported: created.length, equipment: created });
  } catch (error) {
    console.error("Import equipment error:", error);
    return NextResponse.json({ error: "Ошибка при импорте файла" }, { status: 500 });
  }
}
