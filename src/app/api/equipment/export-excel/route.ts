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

    // Define columns — different for SI and IO per official templates
    if (type === "io") {
      worksheet.columns = [
        { header: "№ п/п", key: "num", width: 6 },
        {
          header: "Наименование испытательного оборудования",
          key: "name",
          width: 40,
        },
        { header: "Зав./инвент. номер", key: "serialNumber", width: 18 },
        {
          header: "Дата последней аттестации",
          key: "verificationDate",
          width: 22,
        },
        {
          header: "Периодичность проведения аттестации",
          key: "interval",
          width: 22,
        },
        {
          header: "Дата следующей аттестации",
          key: "nextVerification",
          width: 22,
        },
        { header: "Примечание", key: "notes", width: 25 },
      ];
    } else {
      worksheet.columns = [
        { header: "№ п/п", key: "num", width: 6 },
        {
          header: "Наименование, тип, заводской (серийный) номер",
          key: "nameTypeSN",
          width: 50,
        },
        {
          header: "Периодичность поверки (межповерочный интервал)",
          key: "interval",
          width: 25,
        },
        {
          header: "Дата последней поверки",
          key: "verificationDate",
          width: 22,
        },
        {
          header: "Дата следующей (очередной) поверки",
          key: "nextVerification",
          width: 25,
        },
        { header: "Сведения о поверке (результат)", key: "result", width: 25 },
      ];
    }

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };

    // Add data rows
    equipment.forEach((eq, index) => {
      if (type === "io") {
        worksheet.addRow({
          num: index + 1,
          name: eq.name,
          serialNumber: eq.serialNumber || "",
          verificationDate: formatDate(eq.verificationDate),
          interval: `${eq.interval} мес.`,
          nextVerification: formatDate(eq.nextVerification),
          notes: eq.notes || "",
        });
      } else {
        const nameParts = [
          eq.name,
          eq.type,
          eq.serialNumber ? `зав. № ${eq.serialNumber}` : "",
        ].filter(Boolean);
        worksheet.addRow({
          num: index + 1,
          nameTypeSN: nameParts.join(", "),
          interval: `${eq.interval} мес.`,
          verificationDate: formatDate(eq.verificationDate),
          nextVerification: formatDate(eq.nextVerification),
          result: "",
        });
      }
    });

    // Add auto-filter on header row
    const colCount = type === "io" ? 7 : 6;
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: colCount },
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
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(
          `${fileName}.xlsx`
        )}`,
      },
    });
  } catch (error) {
    console.error("Export Excel error:", error);
    return NextResponse.json({ error: "Ошибка при экспорте" }, { status: 500 });
  }
}
