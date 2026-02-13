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

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categoryParams = searchParams.getAll("category");

    const where: Record<string, unknown> = { userId };
    if (categoryParams.length === 1) {
      where.category = categoryParams[0];
    } else if (categoryParams.length > 1) {
      where.category = { in: categoryParams };
    }

    const equipment = await prisma.equipment.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("Оборудование");

    ws.columns = [
      { header: "№", key: "num", width: 5 },
      { header: "Наименование СИ", key: "name", width: 30 },
      { header: "Тип/Модель", key: "type", width: 20 },
      { header: "Заводской номер", key: "serialNumber", width: 18 },
      { header: "Номер реестра", key: "registryNumber", width: 18 },
      { header: "Дата последней поверки", key: "verificationDate", width: 22 },
      { header: "Дата следующей поверки", key: "nextVerification", width: 22 },
      { header: "Интервал (мес.)", key: "interval", width: 15 },
      { header: "Категория", key: "category", width: 15 },
      { header: "Статус", key: "status", width: 12 },
      { header: "Организация", key: "company", width: 25 },
      { header: "Примечания", key: "notes", width: 30 },
    ];

    // Style header
    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    headerRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0E0E0" } };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    const categoryLabels: Record<string, string> = {
      verification: "Поверка",
      calibration: "Калибровка",
      attestation: "Аттестация",
    };
    const statusLabels: Record<string, string> = {
      active: "Активно",
      pending: "Скоро поверка",
      expired: "Просрочено",
    };

    equipment.forEach((eq, index) => {
      const row = ws.addRow({
        num: index + 1,
        name: eq.name,
        type: eq.type || "",
        serialNumber: eq.serialNumber || "",
        registryNumber: eq.registryNumber || "",
        verificationDate: eq.verificationDate
          ? new Date(eq.verificationDate).toLocaleDateString("ru-RU")
          : "",
        nextVerification: eq.nextVerification
          ? new Date(eq.nextVerification).toLocaleDateString("ru-RU")
          : "",
        interval: eq.interval,
        category: categoryLabels[eq.category] || eq.category,
        status: statusLabels[eq.status] || eq.status,
        company: eq.company || "",
        notes: eq.notes || "",
      });

      row.eachCell((cell) => {
        cell.alignment = { vertical: "middle", wrapText: true };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const dateStr = new Date().toISOString().split("T")[0];

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(`Оборудование_${dateStr}.xlsx`)}`,
      },
    });
  } catch (error) {
    console.error("Export equipment error:", error);
    return NextResponse.json({ error: "Ошибка при экспорте" }, { status: 500 });
  }
}
