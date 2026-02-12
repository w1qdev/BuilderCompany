import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminPassword } from "@/lib/adminAuth";
import * as ExcelJS from "exceljs";

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify admin password
  const headerPassword = req.headers.get("x-admin-password");
  if (!headerPassword || !(await verifyAdminPassword(headerPassword))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const requestId = parseInt(id);
  if (isNaN(requestId)) {
    return NextResponse.json({ error: "Invalid request ID" }, { status: 400 });
  }

  // Fetch request with items and user
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: {
      items: true,
      user: true
    },
  });

  if (!request) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  // Determine organization name: prefer request company, then user company, fallback to name
  const organizationName = request.company || request.user?.company || request.user?.name || request.name;

  // Filter items by service type if filter parameter is provided
  const filter = req.nextUrl.searchParams.get("filter"); // поверка | аттестация | калибровка
  let filteredItems = request.items || [];
  if (filter && filteredItems.length > 0) {
    filteredItems = filteredItems.filter((item) =>
      item.poverk?.toLowerCase().includes(filter.toLowerCase())
    );
  }

  // Create workbook
  const workbook = new ExcelJS.Workbook();
  const sheetName = filter
    ? `Заявка — ${filter.charAt(0).toUpperCase() + filter.slice(1)}`
    : "Заявка на оформление поверки";
  const worksheet = workbook.addWorksheet(sheetName);

  // Set column widths
  worksheet.columns = [
    { width: 5 },   // №
    { width: 25 },  // фирма-владелец
    { width: 30 },  // Калибровка/поверка
    { width: 40 },  // Полное название оборудования
    { width: 15 },  // Заводской №
    { width: 15 },  // реестр №
    { width: 15 },  // Согласованная стоимость
    { width: 25 },  // На какую фирму выставлять счёт
    { width: 30 },  // Комментарии
  ];

  // Add header row (row 2 to match example)
  worksheet.addRow([]);
  const headerRow = worksheet.addRow([
    "№",
    "фирма-владелец оборудования (организация, на кого будет оформлено свидетельство)",
    "Калибровка, аттестация или периодичность поверки (первичная или периодическая)",
    "Полное название оборудования",
    "Заводской №",
    "реестр № (обязательно при поверке!)",
    "Согласованная стоимость",
    "На какую фирму выставлять счёт, наименование ИНН",
    "Комментарии"
  ]);

  // Style header row
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  // Set header row height
  headerRow.height = 60;

  // Add data rows from items
  if (filteredItems.length > 0) {
    filteredItems.forEach((item, index) => {
      const dataRow = worksheet.addRow([
        index + 1,
        organizationName, // фирма-владелец (берём из компании пользователя или имени заявки)
        item.poverk || "", // тип поверки
        item.object || "", // название оборудования
        item.fabricNumber || "", // заводской номер
        item.registry || "", // реестр
        request.clientPrice || "", // согласованная стоимость
        organizationName, // на какую фирму выставлять счёт
        request.message || "" // комментарии
      ]);

      // Style data row
      dataRow.eachCell((cell) => {
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });
  } else {
    // If no items, add single row with main request data
    const dataRow = worksheet.addRow([
      1,
      organizationName,
      request.poverk || "",
      request.object || "",
      request.fabricNumber || "",
      request.registry || "",
      request.clientPrice || "",
      organizationName,
      request.message || ""
    ]);

    dataRow.eachCell((cell) => {
      cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  }

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();

  // Create filename with request ID and date
  const date = new Date(request.createdAt);
  const dateStr = date.toISOString().split('T')[0];
  const filterSuffix = filter ? `_${filter}` : "";
  const filename = `Заявка_${request.id}_${dateStr}${filterSuffix}.xlsx`;

  // Return Excel file
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
