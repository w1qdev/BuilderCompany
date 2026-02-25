import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import ExcelJS from "exceljs";

function formatDate(date: Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function statusLabel(status: string): string {
  switch (status) {
    case "active":
      return "Активно";
    case "pending":
      return "Скоро поверка";
    case "expired":
      return "Просрочено";
    default:
      return status;
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
    const type = searchParams.get("type") || "si";

    const where: Record<string, unknown> = { userId, ignored: false };
    if (categoryParams.length === 1) {
      where.category = categoryParams[0];
    } else if (categoryParams.length > 1) {
      where.category = { in: categoryParams };
    }

    const equipment = await prisma.equipment.findMany({
      where,
      orderBy: { name: "asc" },
    });

    const currentYear = new Date().getFullYear();

    const workbook = new ExcelJS.Workbook();
    const sheetName =
      type === "io"
        ? `График аттестации ИО ${currentYear}`
        : `График поверки СИ ${currentYear}`;
    const worksheet = workbook.addWorksheet(sheetName);

    // Define columns
    worksheet.columns = [
      { header: "№", key: "num", width: 6 },
      { header: "Наименование", key: "name", width: 35 },
      { header: "Тип", key: "type", width: 18 },
      { header: "Зав. номер", key: "serialNumber", width: 16 },
      { header: "Реестр", key: "registryNumber", width: 16 },
      { header: "Дата последней поверки", key: "verificationDate", width: 22 },
      { header: "Дата следующей поверки", key: "nextVerification", width: 22 },
      { header: "Статус", key: "status", width: 16 },
      { header: "Периодичность (мес.)", key: "interval", width: 20 },
    ];

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { vertical: "middle", horizontal: "center", wrapText: true };

    // Add data rows
    equipment.forEach((eq, index) => {
      worksheet.addRow({
        num: index + 1,
        name: eq.name,
        type: eq.type || "",
        serialNumber: eq.serialNumber || "",
        registryNumber: eq.registryNumber || "",
        verificationDate: formatDate(eq.verificationDate),
        nextVerification: formatDate(eq.nextVerification),
        status: statusLabel(eq.status),
        interval: eq.interval,
      });
    });

    // Add auto-filter on header row
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: 9 },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    const uint8 = new Uint8Array(buffer as ArrayBuffer);

    const fileName =
      type === "io"
        ? `График_аттестации_ИО_${currentYear}`
        : `График_поверки_СИ_${currentYear}`;

    return new NextResponse(uint8, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(`${fileName}.xlsx`)}`,
      },
    });
  } catch (error) {
    console.error("Export Excel error:", error);
    return NextResponse.json({ error: "Ошибка при экспорте" }, { status: 500 });
  }
}
