import nodemailer from "nodemailer";
import * as ExcelJS from "exceljs";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import path from "path";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

interface NotificationItem {
  service: string;
  poverk?: string;
  object?: string;
  fabricNumber?: string;
  registry?: string;
}

function createTransporter() {
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

async function generateExcelBuffer(
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

// ─── Admin notification email ───

interface AdminEmailData {
  name: string;
  phone: string;
  email: string;
  company?: string;
  inn?: string;
  message?: string;
  needContract?: boolean;
  fileName?: string;
  filePath?: string;
  requestId?: number;
  items: NotificationItem[];
  toEmail?: string;
}

export async function sendEmailNotification(data: AdminEmailData) {
  const result = createTransporter();
  if (!result) {
    console.log("Email not configured, skipping notification");
    return;
  }
  const { transporter, user } = result;
  const notifyEmail = process.env.NOTIFY_EMAIL;

  const servicesSummary = data.items.map((i) => i.service).join(", ");
  const orgName = data.company || data.name;

  // Build items HTML
  const itemsHtml = data.items
    .map(
      (item, idx) => `
    <tr>
      <td style="padding: 10px 14px; border-bottom: 1px solid #f0f0f0; color: #666; font-size: 13px; text-align: center;">${idx + 1}</td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #f0f0f0; font-size: 13px;">${escapeHtml(item.service)}</td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #f0f0f0; font-size: 13px;">${item.poverk ? escapeHtml(item.poverk) : '<span style="color: #ccc;">—</span>'}</td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #f0f0f0; font-size: 13px;">${item.object ? escapeHtml(item.object) : '<span style="color: #ccc;">—</span>'}</td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #f0f0f0; font-size: 13px;">${item.fabricNumber ? escapeHtml(item.fabricNumber) : '<span style="color: #ccc;">—</span>'}</td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #f0f0f0; font-size: 13px;">${item.registry ? escapeHtml(item.registry) : '<span style="color: #ccc;">—</span>'}</td>
    </tr>`,
    )
    .join("");

  const contractHtml = data.needContract !== undefined
    ? `
    <tr>
      <td style="padding: 12px 16px; background: #f9f9f9; font-weight: 600; color: #555; width: 180px; border-bottom: 1px solid #eee;">Договор оказания услуг</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #eee;">
        <span style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; ${data.needContract ? 'background: #dcfce7; color: #16a34a;' : 'background: #f3f4f6; color: #6b7280;'}">
          ${data.needContract ? "&#10003; Требуется" : "&#10007; Не требуется"}
        </span>
      </td>
    </tr>`
    : "";

  const html = `
<!DOCTYPE html>
<html lang="ru">
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background: #f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
  <div style="max-width: 640px; margin: 0 auto; padding: 24px 16px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%); border-radius: 16px 16px 0 0; padding: 28px 32px; text-align: center;">
      <h1 style="margin: 0 0 6px 0; font-size: 20px; color: #fff; font-weight: 700;">Новая заявка с сайта</h1>
      <p style="margin: 0; font-size: 13px; color: rgba(255,255,255,0.5);">Заявка №${data.requestId || "—"} &middot; ${new Date().toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
    </div>

    <!-- Body -->
    <div style="background: #ffffff; padding: 0; border-left: 1px solid #eee; border-right: 1px solid #eee;">
      <!-- Contact info -->
      <div style="padding: 24px 32px 16px;">
        <h2 style="margin: 0 0 16px 0; font-size: 15px; color: #333; text-transform: uppercase; letter-spacing: 0.5px;">Контактные данные</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px 16px; background: #f9f9f9; font-weight: 600; color: #555; width: 180px; border-bottom: 1px solid #eee;">Имя</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #eee;">${escapeHtml(data.name)}</td>
          </tr>
          ${data.company ? `
          <tr>
            <td style="padding: 12px 16px; background: #f9f9f9; font-weight: 600; color: #555; border-bottom: 1px solid #eee;">Организация</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #eee;">${escapeHtml(data.company)}</td>
          </tr>` : ""}
          ${data.inn ? `
          <tr>
            <td style="padding: 12px 16px; background: #f9f9f9; font-weight: 600; color: #555; border-bottom: 1px solid #eee;">ИНН</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #eee; font-family: monospace;">${escapeHtml(data.inn)}</td>
          </tr>` : ""}
          <tr>
            <td style="padding: 12px 16px; background: #f9f9f9; font-weight: 600; color: #555; border-bottom: 1px solid #eee;">Телефон</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #eee;"><a href="tel:${escapeHtml(data.phone)}" style="color: #e8733a; text-decoration: none;">${escapeHtml(data.phone)}</a></td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; background: #f9f9f9; font-weight: 600; color: #555; border-bottom: 1px solid #eee;">Email</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #eee;"><a href="mailto:${escapeHtml(data.email)}" style="color: #e8733a; text-decoration: none;">${escapeHtml(data.email)}</a></td>
          </tr>
          ${contractHtml}
        </table>
      </div>

      ${data.message ? `
      <!-- Message -->
      <div style="padding: 0 32px 16px;">
        <h2 style="margin: 0 0 12px 0; font-size: 15px; color: #333; text-transform: uppercase; letter-spacing: 0.5px;">Сообщение</h2>
        <div style="background: #fafafa; border-left: 3px solid #e8733a; padding: 14px 18px; border-radius: 0 8px 8px 0; font-size: 14px; color: #444; line-height: 1.6;">
          ${escapeHtml(data.message)}
        </div>
      </div>` : ""}

      <!-- Items -->
      <div style="padding: 0 32px 24px;">
        <h2 style="margin: 0 0 12px 0; font-size: 15px; color: #333; text-transform: uppercase; letter-spacing: 0.5px;">Позиции заявки (${data.items.length})</h2>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; min-width: 500px;">
            <thead>
              <tr style="background: #f9f9f9;">
                <th style="padding: 10px 14px; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; text-align: center; border-bottom: 2px solid #eee;">№</th>
                <th style="padding: 10px 14px; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; border-bottom: 2px solid #eee;">Услуга</th>
                <th style="padding: 10px 14px; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; border-bottom: 2px solid #eee;">Поверка</th>
                <th style="padding: 10px 14px; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; border-bottom: 2px solid #eee;">СИ</th>
                <th style="padding: 10px 14px; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; border-bottom: 2px solid #eee;">Зав. №</th>
                <th style="padding: 10px 14px; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; border-bottom: 2px solid #eee;">Реестр</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>
      </div>

      ${data.fileName ? `
      <!-- File attachment note -->
      <div style="padding: 0 32px 24px;">
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 14px 18px; font-size: 13px; color: #1e40af;">
          &#128206; Прикрепленный файл клиента: <strong>${escapeHtml(data.fileName)}</strong> — во вложении письма
        </div>
      </div>` : ""}
    </div>

    <!-- Footer -->
    <div style="background: #f9f9fb; border-radius: 0 0 16px 16px; padding: 20px 32px; border: 1px solid #eee; border-top: none; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #999;">Excel-файл с позициями заявки во вложении</p>
      <p style="margin: 6px 0 0 0; font-size: 12px; color: #bbb;">ЦСМ — Центр Стандартизации и Метрологии</p>
    </div>
  </div>
</body>
</html>`;

  // Build attachments
  const attachments: nodemailer.SendMailOptions["attachments"] = [];

  // 1. Excel file with all items
  try {
    const excelBuffer = await generateExcelBuffer(data.items, orgName, data.inn, data.message);
    const dateStr = new Date().toISOString().split("T")[0];
    attachments.push({
      filename: `Заявка_${data.requestId || "new"}_${dateStr}.xlsx`,
      content: excelBuffer,
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  } catch (err) {
    console.error("Failed to generate Excel attachment:", err);
  }

  // 2. Client uploaded file
  if (data.filePath && data.fileName) {
    try {
      const absPath = path.join(process.cwd(), "uploads", path.basename(data.filePath));
      if (existsSync(absPath)) {
        const fileContent = await readFile(absPath);
        attachments.push({
          filename: data.fileName,
          content: fileContent,
        });
      }
    } catch (err) {
      console.error("Failed to attach client file:", err);
    }
  }

  try {
    await transporter.sendMail({
      from: `"ЦСМ — Заявки" <${user}>`,
      to: data.toEmail || notifyEmail || user,
      subject: `Заявка №${data.requestId || "—"}: ${servicesSummary} — ${orgName}`,
      html,
      attachments,
    });
  } catch (error) {
    console.error("Email notification error:", error);
  }
}

// ─── Verification reminder email ───

export async function sendVerificationReminderEmail(data: {
  userName: string;
  email: string;
  equipment: { name: string; type: string | null; serialNumber: string | null; registryNumber: string | null; nextVerification: Date; category: string }[];
}) {
  const result = createTransporter();
  if (!result) return;
  const { transporter, user } = result;

  const categoryLabels: Record<string, string> = {
    verification: "Поверка",
    calibration: "Калибровка",
    attestation: "Аттестация",
  };

  const itemsHtml = data.equipment
    .map(
      (eq, idx) => `
    <tr>
      <td style="padding: 10px 14px; border-bottom: 1px solid #f0f0f0; color: #666; font-size: 13px; text-align: center;">${idx + 1}</td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #f0f0f0; font-size: 13px; font-weight: 600;">${escapeHtml(eq.name)}</td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #f0f0f0; font-size: 13px;">${eq.type ? escapeHtml(eq.type) : '—'}</td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #f0f0f0; font-size: 13px;">${eq.serialNumber ? escapeHtml(eq.serialNumber) : '—'}</td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #f0f0f0; font-size: 13px;">${categoryLabels[eq.category] || eq.category}</td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #f0f0f0; font-size: 13px; font-weight: 600; color: #e8733a;">${new Date(eq.nextVerification).toLocaleDateString("ru-RU")}</td>
    </tr>`,
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html lang="ru">
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background: #f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
  <div style="max-width: 640px; margin: 0 auto; padding: 24px 16px;">
    <div style="background: linear-gradient(135deg, #e8733a 0%, #d4572a 100%); border-radius: 16px 16px 0 0; padding: 28px 32px; text-align: center;">
      <h1 style="margin: 0 0 6px 0; font-size: 20px; color: #fff; font-weight: 700;">Напоминание о поверке</h1>
      <p style="margin: 0; font-size: 13px; color: rgba(255,255,255,0.7);">Центр Стандартизации и Метрологии</p>
    </div>
    <div style="background: #ffffff; padding: 24px 32px; border-left: 1px solid #eee; border-right: 1px solid #eee;">
      <p style="font-size: 14px; color: #333; margin: 0 0 16px 0;">Уважаемый(-ая) <strong>${escapeHtml(data.userName)}</strong>,</p>
      <p style="font-size: 14px; color: #555; margin: 0 0 20px 0;">Следующее оборудование требует поверки в ближайшие 14 дней:</p>
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f9f9f9;">
              <th style="padding: 10px 14px; font-size: 12px; color: #888; text-align: center; border-bottom: 2px solid #eee;">№</th>
              <th style="padding: 10px 14px; font-size: 12px; color: #888; text-align: left; border-bottom: 2px solid #eee;">Наименование</th>
              <th style="padding: 10px 14px; font-size: 12px; color: #888; text-align: left; border-bottom: 2px solid #eee;">Тип</th>
              <th style="padding: 10px 14px; font-size: 12px; color: #888; text-align: left; border-bottom: 2px solid #eee;">Зав. №</th>
              <th style="padding: 10px 14px; font-size: 12px; color: #888; text-align: left; border-bottom: 2px solid #eee;">Категория</th>
              <th style="padding: 10px 14px; font-size: 12px; color: #888; text-align: left; border-bottom: 2px solid #eee;">Дата поверки</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
      </div>
      <div style="margin: 24px 0; text-align: center;">
        <a href="https://csm-center.ru/dashboard/equipment" style="display: inline-block; background: linear-gradient(135deg, #e8733a, #d4572a); color: #fff; text-decoration: none; padding: 12px 32px; border-radius: 12px; font-size: 14px; font-weight: 600;">Оформить заявку</a>
      </div>
      <p style="font-size: 13px; color: #888; margin: 0;">Вы можете создать заявку на поверку прямо из личного кабинета.</p>
    </div>
    <div style="background: #f9f9fb; border-radius: 0 0 16px 16px; padding: 20px 32px; border: 1px solid #eee; border-top: none; text-align: center;">
      <p style="margin: 0 0 4px 0; font-size: 12px; color: #bbb;">ЦСМ — Центр Стандартизации и Метрологии</p>
      <p style="margin: 0; font-size: 11px; color: #ddd;">+7 (966) 730-30-03 &middot; zakaz@csm-center.ru</p>
    </div>
  </div>
</body>
</html>`;

  try {
    await transporter.sendMail({
      from: `"ЦСМ — Напоминания" <${user}>`,
      to: data.email,
      subject: `Напоминание: ${data.equipment.length} ед. оборудования требуют поверки`,
      html,
    });
  } catch (error) {
    console.error("Verification reminder email error:", error);
  }
}

// ─── Customer confirmation email ───

export async function sendConfirmationEmail(data: {
  name: string;
  email: string;
  requestId?: number;
  items: NotificationItem[];
}) {
  const result = createTransporter();
  if (!result) {
    console.log("Email not configured, skipping confirmation");
    return;
  }
  const { transporter, user } = result;

  const servicesSummary = data.items.map((i) => i.service).join(", ");

  const itemsHtml = data.items
    .map(
      (item, idx) => `
    <tr>
      <td style="padding: 12px 16px; border-bottom: 1px solid #f0f0f0; color: #999; font-size: 13px; text-align: center; width: 40px;">${idx + 1}</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #f0f0f0;">
        <div style="font-size: 14px; font-weight: 600; color: #333; margin-bottom: 4px;">${escapeHtml(item.service)}</div>
        <div style="font-size: 12px; color: #888; line-height: 1.6;">
          ${item.poverk ? `Поверка: ${escapeHtml(item.poverk)}` : ""}
          ${item.object ? `${item.poverk ? " &middot; " : ""}СИ: ${escapeHtml(item.object)}` : ""}
          ${item.fabricNumber ? `${item.poverk || item.object ? " &middot; " : ""}Зав. №: ${escapeHtml(item.fabricNumber)}` : ""}
          ${item.registry ? `${item.poverk || item.object || item.fabricNumber ? " &middot; " : ""}Реестр: ${escapeHtml(item.registry)}` : ""}
        </div>
      </td>
    </tr>`,
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html lang="ru">
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background: #f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 24px 16px;">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #e8733a 0%, #d4572a 100%); border-radius: 16px 16px 0 0; padding: 36px 32px; text-align: center;">
      <h1 style="color: #fff; margin: 0 0 8px 0; font-size: 22px; font-weight: 700; letter-spacing: -0.3px;">Центр Стандартизации и Метрологии</h1>
      <p style="color: rgba(255,255,255,0.7); margin: 0; font-size: 13px;">Калибровка &middot; Поверка &middot; Аттестация</p>
    </div>

    <!-- Body -->
    <div style="background: #ffffff; padding: 0; border-left: 1px solid #eee; border-right: 1px solid #eee;">

      <!-- Greeting -->
      <div style="padding: 32px 32px 0;">
        <p style="font-size: 16px; color: #333; margin: 0 0 16px 0; line-height: 1.5;">Уважаемый(-ая) <strong>${escapeHtml(data.name)}</strong>,</p>
        <p style="font-size: 14px; color: #555; margin: 0 0 12px 0; line-height: 1.6;">Благодарим вас за обращение! Ваша заявка успешно принята и зарегистрирована${data.requestId ? ` под номером <strong style="color: #e8733a;">№${data.requestId}</strong>` : ""}.</p>
      </div>

      <!-- Status card -->
      <div style="padding: 0 32px; margin: 20px 0;">
        <div style="background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px 24px; text-align: center;">
          <div style="font-size: 28px; margin-bottom: 8px;">&#10003;</div>
          <div style="font-size: 15px; font-weight: 700; color: #166534; margin-bottom: 4px;">Заявка принята</div>
          <div style="font-size: 13px; color: #16a34a;">Наши специалисты свяжутся с вами в ближайшее время</div>
        </div>
      </div>

      <!-- What happens next -->
      <div style="padding: 0 32px;">
        <h2 style="margin: 24px 0 16px 0; font-size: 15px; color: #333; text-transform: uppercase; letter-spacing: 0.5px;">Что дальше?</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px 0; vertical-align: top; width: 44px;">
              <div style="width: 32px; height: 32px; background: #fef3c7; border-radius: 8px; text-align: center; line-height: 32px; font-size: 14px;">1</div>
            </td>
            <td style="padding: 12px 0; vertical-align: top;">
              <div style="font-size: 14px; font-weight: 600; color: #333;">Рассмотрение заявки</div>
              <div style="font-size: 13px; color: #888; margin-top: 2px;">Мы изучим вашу заявку и подготовим предложение</div>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; vertical-align: top; width: 44px;">
              <div style="width: 32px; height: 32px; background: #dbeafe; border-radius: 8px; text-align: center; line-height: 32px; font-size: 14px;">2</div>
            </td>
            <td style="padding: 12px 0; vertical-align: top;">
              <div style="font-size: 14px; font-weight: 600; color: #333;">Согласование деталей</div>
              <div style="font-size: 13px; color: #888; margin-top: 2px;">Специалист свяжется с вами для уточнения сроков и стоимости</div>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; vertical-align: top; width: 44px;">
              <div style="width: 32px; height: 32px; background: #dcfce7; border-radius: 8px; text-align: center; line-height: 32px; font-size: 14px;">3</div>
            </td>
            <td style="padding: 12px 0; vertical-align: top;">
              <div style="font-size: 14px; font-weight: 600; color: #333;">Выполнение работ</div>
              <div style="font-size: 13px; color: #888; margin-top: 2px;">Проведём работы и предоставим необходимую документацию</div>
            </td>
          </tr>
        </table>
      </div>

      <!-- Items -->
      <div style="padding: 0 32px 8px;">
        <h2 style="margin: 28px 0 12px 0; font-size: 15px; color: #333; text-transform: uppercase; letter-spacing: 0.5px;">Ваша заявка (${data.items.length} ${data.items.length === 1 ? "позиция" : data.items.length < 5 ? "позиции" : "позиций"})</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
      </div>

      <!-- Divider -->
      <div style="padding: 0 32px;">
        <hr style="border: none; border-top: 1px solid #f0f0f0; margin: 24px 0 0 0;" />
      </div>

      <!-- Contact info -->
      <div style="padding: 20px 32px 28px;">
        <p style="font-size: 13px; color: #888; margin: 0 0 12px 0;">Если у вас есть вопросы, вы можете связаться с нами:</p>
        <table style="border-collapse: collapse;">
          <tr>
            <td style="padding: 4px 12px 4px 0; font-size: 13px; color: #aaa;">Телефон</td>
            <td style="padding: 4px 0; font-size: 13px;"><a href="tel:+79667303003" style="color: #e8733a; text-decoration: none; font-weight: 600;">+7 (966) 730-30-03</a></td>
          </tr>
          <tr>
            <td style="padding: 4px 12px 4px 0; font-size: 13px; color: #aaa;">Email</td>
            <td style="padding: 4px 0; font-size: 13px;"><a href="mailto:zakaz@csm-center.ru" style="color: #e8733a; text-decoration: none; font-weight: 600;">zakaz@csm-center.ru</a></td>
          </tr>
          <tr>
            <td style="padding: 4px 12px 4px 0; font-size: 13px; color: #aaa;">Сайт</td>
            <td style="padding: 4px 0; font-size: 13px;"><a href="https://csm-center.ru" style="color: #e8733a; text-decoration: none; font-weight: 600;">csm-center.ru</a></td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #f9f9fb; border-radius: 0 0 16px 16px; padding: 20px 32px; border: 1px solid #eee; border-top: none; text-align: center;">
      <p style="margin: 0 0 4px 0; font-size: 12px; color: #bbb;">ЦСМ — Центр Стандартизации и Метрологии</p>
      <p style="margin: 0; font-size: 11px; color: #ddd;">Если вы получили это письмо по ошибке, пожалуйста, проигнорируйте его.</p>
    </div>

  </div>
</body>
</html>`;

  try {
    await transporter.sendMail({
      from: `"Центр Стандартизации и Метрологии" <${user}>`,
      to: data.email,
      subject: `Заявка ${data.requestId ? `№${data.requestId} ` : ""}принята — ${servicesSummary}`,
      html,
    });
  } catch (error) {
    console.error("Confirmation email error:", error);
  }
}
