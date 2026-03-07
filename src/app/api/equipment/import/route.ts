import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import ExcelJS from "exceljs";
import { calculateEquipmentStatus } from "@/lib/equipmentStatus";

export const dynamic = "force-dynamic";

const EXPECTED_HEADERS = [
  "Наименование",
  "Тип",
  "Зав. номер",
  "Дата последней поверки",
  "Дата следующей поверки",
  "Периодичность (мес.)",
  "Примечание",
];

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return null;
    return value;
  }
  if (typeof value === "number") {
    // Excel serial date number
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + value * 86400000);
    if (isNaN(date.getTime())) return null;
    return date;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    // Try DD.MM.YYYY format (common in Russian locale)
    const ddmmyyyy = trimmed.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})$/);
    if (ddmmyyyy) {
      const date = new Date(
        Number(ddmmyyyy[3]),
        Number(ddmmyyyy[2]) - 1,
        Number(ddmmyyyy[1])
      );
      if (!isNaN(date.getTime())) return date;
    }
    // Try ISO format (YYYY-MM-DD)
    const iso = new Date(trimmed);
    if (!isNaN(iso.getTime())) return iso;
    return null;
  }
  return null;
}

function getCellText(cell: ExcelJS.Cell): string {
  const value = cell.value;
  if (value === null || value === undefined) return "";
  if (typeof value === "object" && "result" in value) {
    return String((value as ExcelJS.CellFormulaValue).result ?? "");
  }
  if (typeof value === "object" && "richText" in value) {
    return (value as ExcelJS.CellRichTextValue).richText
      .map((rt) => rt.text)
      .join("");
  }
  return String(value);
}

// GET — return a template .xlsx file with the correct headers
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Шаблон");

  sheet.columns = EXPECTED_HEADERS.map((header) => ({
    header,
    width: header.length + 8,
  }));

  // Style the header row
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.commit();

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer as ArrayBuffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="equipment_template.xlsx"',
    },
  });
}

// POST — bulk import equipment from an uploaded .xlsx file
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const category = (formData.get("category") as string) || "verification";
    const organizationId = Number(formData.get("organizationId"));

    if (!organizationId) {
      return NextResponse.json({ error: "organizationId обязателен" }, { status: 400 });
    }

    const { isOrgMember } = await import("@/lib/orgAccess");
    if (!(await isOrgMember(userId, organizationId))) {
      return NextResponse.json({ error: "Нет доступа к организации" }, { status: 403 });
    }

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "Файл не найден" },
        { status: 400 }
      );
    }

    const fileName = (file as File).name?.toLowerCase() ?? "";
    if (
      !fileName.endsWith(".xlsx") &&
      file.type !==
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      return NextResponse.json(
        { error: "Поддерживается только формат .xlsx" },
        { status: 400 }
      );
    }

    // Limit file size to 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Файл слишком большой (максимум 5 МБ)" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();

    const workbook = new ExcelJS.Workbook();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await workbook.xlsx.load(arrayBuffer as any);

    const sheet = workbook.worksheets[0];
    if (!sheet) {
      return NextResponse.json(
        { error: "Файл не содержит листов" },
        { status: 400 }
      );
    }

    const errors: string[] = [];
    let skipped = 0;

    const dataToCreate: {
      userId: number;
      organizationId: number;
      name: string;
      type: string | null;
      serialNumber: string | null;
      verificationDate: Date | null;
      nextVerification: Date | null;
      interval: number;
      category: string;
      status: string;
      notes: string | null;
    }[] = [];

    const rowCount = sheet.rowCount;
    // Row 1 is the header; data starts at row 2
    for (let rowNum = 2; rowNum <= rowCount; rowNum++) {
      const row = sheet.getRow(rowNum);

      const name = getCellText(row.getCell(1)).trim();
      const type = getCellText(row.getCell(2)).trim();
      const serialNumber = getCellText(row.getCell(3)).trim();
      const verificationDateRaw = row.getCell(4).value;
      const nextVerificationRaw = row.getCell(5).value;
      const intervalRaw = getCellText(row.getCell(6)).trim();
      const notes = getCellText(row.getCell(7)).trim();

      // Skip completely empty rows
      if (
        !name &&
        !type &&
        !serialNumber &&
        !verificationDateRaw &&
        !nextVerificationRaw &&
        !intervalRaw &&
        !notes
      ) {
        continue;
      }

      // Name is required — skip row without it
      if (!name) {
        skipped++;
        errors.push(`Строка ${rowNum}: отсутствует Наименование, пропущена`);
        continue;
      }

      const verificationDate = parseDate(verificationDateRaw);
      const nextVerification = parseDate(nextVerificationRaw);

      if (verificationDateRaw && !verificationDate) {
        errors.push(
          `Строка ${rowNum}: не удалось распознать дату последней поверки`
        );
      }
      if (nextVerificationRaw && !nextVerification) {
        errors.push(
          `Строка ${rowNum}: не удалось распознать дату следующей поверки`
        );
      }

      const interval = intervalRaw ? parseInt(intervalRaw, 10) : 12;
      const status = calculateEquipmentStatus(nextVerification);

      dataToCreate.push({
        userId,
        organizationId,
        name,
        type: type || null,
        serialNumber: serialNumber || null,
        verificationDate,
        nextVerification,
        interval: isNaN(interval) ? 12 : interval,
        category,
        status,
        notes: notes || null,
      });
    }

    let imported = 0;
    if (dataToCreate.length > 0) {
      const result = await prisma.equipment.createMany({
        data: dataToCreate,
      });
      imported = result.count;
    }

    return NextResponse.json({ imported, skipped, errors });
  } catch (error) {
    console.error("Import equipment error:", error);
    return NextResponse.json(
      { error: "Ошибка при импорте оборудования" },
      { status: 500 }
    );
  }
}
