import nodemailer from "nodemailer";
import * as ExcelJS from "exceljs";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import path from "path";

// ─── Helpers ───

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ─── Types ───

export interface NotificationItem {
  service: string;
  poverk?: string;
  object?: string;
  fabricNumber?: string;
  registry?: string;
}

export interface FileData {
  fileName: string;
  filePath: string;
}

// ─── Transporter ───

export interface TransporterResult {
  transporter: nodemailer.Transporter;
  user: string;
}

export function createTransporter(): TransporterResult | null {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass || host === "smtp.example.com") {
    return null;
  }

  return {
    transporter: nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    }),
    user,
  };
}

export function createSupportTransporter(): TransporterResult | null {
  const host = process.env.SUPPORT_SMTP_HOST;
  const port = Number(process.env.SUPPORT_SMTP_PORT) || 587;
  const user = process.env.SUPPORT_SMTP_USER;
  const pass = process.env.SUPPORT_SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return {
    transporter: nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    }),
    user,
  };
}

// ─── Excel generation ───

export async function generateExcelBuffer(
  items: NotificationItem[],
  company: string,
  inn?: string,
  message?: string,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Заявка на оформление поверки");

  worksheet.columns = [
    { width: 5 },
    { width: 25 },
    { width: 30 },
    { width: 40 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
    { width: 25 },
    { width: 30 },
  ];

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
    "Комментарии",
  ]);

  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0E0E0" } };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });
  headerRow.height = 60;

  const resolveServiceType = (service: string, poverk?: string) => {
    if (service === "Поверка СИ" && poverk) return `Поверка ${poverk.toLowerCase()}`;
    if (service === "Поверка СИ") return "Поверка";
    return service;
  };

  items.forEach((item, index) => {
    const dataRow = worksheet.addRow([
      index + 1,
      company,
      resolveServiceType(item.service, item.poverk),
      item.object || "",
      item.fabricNumber || "",
      item.registry || "",
      "",
      inn ? `${company}, ИНН ${inn}` : company,
      message || "",
    ]);

    dataRow.eachCell((cell) => {
      cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  });

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

// ─── File attachment helpers ───

export async function resolveAttachments(
  files?: FileData[],
  fileName?: string,
  filePath?: string,
): Promise<nodemailer.SendMailOptions["attachments"]> {
  const attachments: nodemailer.SendMailOptions["attachments"] = [];

  const allFiles = files && files.length > 0
    ? files
    : (filePath && fileName ? [{ fileName, filePath }] : []);

  for (const file of allFiles) {
    try {
      const absPath = path.join(process.cwd(), "uploads", path.basename(file.filePath));
      if (existsSync(absPath)) {
        const fileContent = await readFile(absPath);
        attachments.push({
          filename: file.fileName,
          content: fileContent,
        });
      }
    } catch (err) {
      console.error("Failed to attach client file:", err);
    }
  }

  return attachments;
}
