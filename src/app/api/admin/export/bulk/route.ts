import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminPassword } from "@/lib/adminAuth";
import { createRateLimiter } from "@/lib/rateLimit";
import * as ExcelJS from "exceljs";

export const dynamic = "force-dynamic";

const adminExportBulkLimiter = createRateLimiter({
  max: 20,
  windowMs: 60 * 1000,
});

export async function GET(req: NextRequest) {
  if (!adminExportBulkLimiter(req)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const headerPassword = req.headers.get("x-admin-password");
  if (!headerPassword || !(await verifyAdminPassword(headerPassword))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search")?.trim() || "";
  const dateFrom = searchParams.get("dateFrom");

  const where: Record<string, unknown> = {};
  if (status && status !== "all") where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { phone: { contains: search } },
      { email: { contains: search } },
    ];
  }
  if (dateFrom) {
    where.createdAt = { gte: new Date(dateFrom) };
  }

  const requests = await prisma.request.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { items: true, user: true },
  });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Все заявки");

  worksheet.columns = [
    { width: 6 },
    { width: 18 },
    { width: 20 },
    { width: 15 },
    { width: 25 },
    { width: 25 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
    { width: 20 },
    { width: 30 },
    { width: 15 },
  ];

  const headerRow = worksheet.addRow([
    "ID",
    "Дата",
    "Имя / Компания",
    "Телефон",
    "Email",
    "Услуга",
    "Статус",
    "Исполнитель",
    "Цена клиента",
    "Цена исполнителя",
    "Заметки",
    "Договор",
  ]);

  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  const statusLabels: Record<string, string> = {
    new: "Новая",
    in_progress: "В работе",
    pending_payment: "Ожидает оплаты",
    review: "На проверке",
    done: "Завершена",
    cancelled: "Отменена",
  };

  for (const r of requests) {
    const date = new Date(r.createdAt).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const dataRow = worksheet.addRow([
      r.id,
      date,
      r.company || r.name,
      r.phone,
      r.email,
      r.service,
      statusLabels[r.status] || r.status,
      r.assignee || "",
      r.clientPrice ? `${r.clientPrice.toFixed(2)} ₽` : "",
      r.executorPrice ? `${r.executorPrice.toFixed(2)} ₽` : "",
      r.adminNotes || "",
      r.needContract ? "Да" : "Нет",
    ]);

    dataRow.eachCell((cell) => {
      cell.alignment = {
        vertical: "middle",
        horizontal: "left",
        wrapText: true,
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const dateStr = new Date().toISOString().split("T")[0];
  const filename = `Все_заявки_${dateStr}.xlsx`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(
        filename
      )}`,
    },
  });
}
