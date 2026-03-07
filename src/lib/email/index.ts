/**
 * Email module — public API.
 *
 * All functions previously exported from `src/lib/email.ts` are re-exported
 * here so that `import { ... } from "@/lib/email"` continues to work.
 */

import {
  createTransporter,
  generateExcelBuffer,
  resolveAttachments,
} from "./transport";
import type { NotificationItem, FileData } from "./transport";
import {
  buildAdminNotificationHtml,
  buildVerificationReminderHtml,
  buildPasswordResetHtml,
  buildConfirmationHtml,
  buildArshinVerificationHtml,
  buildWelcomeHtml,
  buildStatusUpdateHtml,
} from "./templates";
import { COMPANY_NAME, COMPANY_SHORT } from "./constants";
import logger from "@/lib/logger";

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
  files?: FileData[];
  requestId?: number;
  items: NotificationItem[];
  toEmail?: string;
}

export async function sendEmailNotification(data: AdminEmailData) {
  const result = createTransporter();
  if (!result) {
    logger.info("Email not configured, skipping notification");
    return;
  }
  const { transporter, user } = result;
  const notifyEmail = process.env.ZAKAZ_EMAIL || process.env.NOTIFY_EMAIL;

  const servicesSummary = data.items.map((i) => i.service).join(", ");
  const orgName = data.company || data.name;

  const html = buildAdminNotificationHtml(data);

  // Build attachments
  const attachments: import("nodemailer").SendMailOptions["attachments"] = [];

  // 1. Excel file with all items
  try {
    const excelBuffer = await generateExcelBuffer(
      data.items,
      orgName,
      data.inn,
      data.message
    );
    const dateStr = new Date().toISOString().split("T")[0];
    attachments.push({
      filename: `Заявка_${data.requestId || "new"}_${dateStr}.xlsx`,
      content: excelBuffer,
      contentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  } catch (err) {
    logger.error("Failed to generate Excel attachment:", err);
  }

  // 2. Client uploaded files
  const clientAttachments = await resolveAttachments(
    data.files,
    data.fileName,
    data.filePath
  );
  if (clientAttachments) {
    attachments.push(...clientAttachments);
  }

  try {
    await transporter.sendMail({
      from: `"${COMPANY_SHORT} — Заявки" <${user}>`,
      to: data.toEmail || notifyEmail || user,
      subject: `Заявка №${
        data.requestId || "—"
      }: ${servicesSummary} — ${orgName}`,
      html,
      attachments,
    });
  } catch (error) {
    logger.error("Email notification error:", error);
  }
}

// ─── Verification reminder email ───

export async function sendVerificationReminderEmail(data: {
  userName: string;
  email: string;
  equipment: {
    name: string;
    type: string | null;
    serialNumber: string | null;
    nextVerification: Date;
    category: string;
  }[];
}) {
  const result = createTransporter();
  if (!result) return;
  const { transporter, user } = result;

  const html = buildVerificationReminderHtml(data);

  try {
    await transporter.sendMail({
      from: `"${COMPANY_SHORT} — Напоминания" <${user}>`,
      to: data.email,
      subject: `Напоминание: ${data.equipment.length} ед. оборудования требуют поверки`,
      html,
    });
  } catch (error) {
    logger.error("Verification reminder email error:", error);
  }
}

// ─── Password reset email ───

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const result = createTransporter();
  if (!result) {
    logger.info("Email not configured, skipping password reset email");
    return;
  }
  const { transporter, user } = result;

  const html = buildPasswordResetHtml(resetUrl);

  try {
    await transporter.sendMail({
      from: `"${COMPANY_NAME}" <${user}>`,
      to: email,
      subject: `Сброс пароля — ${COMPANY_SHORT}`,
      html,
    });
  } catch (error) {
    logger.error("Password reset email error:", error);
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
    logger.info("Email not configured, skipping confirmation");
    return;
  }
  const { transporter, user } = result;

  const servicesSummary = data.items.map((i) => i.service).join(", ");
  const html = buildConfirmationHtml(data);

  try {
    await transporter.sendMail({
      from: `"${COMPANY_NAME}" <${user}>`,
      to: data.email,
      subject: `Заявка ${
        data.requestId ? `№${data.requestId} ` : ""
      }принята — ${servicesSummary}`,
      html,
    });
  } catch (error) {
    logger.error("Confirmation email error:", error);
  }
}

// ─── Arshin new verification notification ───

export async function sendArshinVerificationEmail(data: {
  userName: string;
  email: string;
  equipment: {
    name: string;
    type: string | null;
    serialNumber: string | null;
    validDate: string;
    arshinUrl: string | null;
  }[];
}) {
  const result = createTransporter();
  if (!result) return;
  const { transporter, user } = result;

  const html = buildArshinVerificationHtml(data);

  try {
    await transporter.sendMail({
      from: `"${COMPANY_SHORT} — Уведомления" <${user}>`,
      to: data.email,
      subject: `Поверка зарегистрирована в Аршин: ${data.equipment
        .map((e) => e.name)
        .join(", ")}`,
      html,
    });
  } catch (error) {
    logger.error("Arshin verification email error:", error);
  }
}

// ─── Welcome (registration) email ───

export async function sendWelcomeEmail(data: { name: string; email: string }) {
  const result = createTransporter();
  if (!result) {
    logger.info("Email not configured, skipping welcome email");
    return;
  }
  const { transporter, user } = result;

  const html = buildWelcomeHtml(data);

  try {
    await transporter.sendMail({
      from: `"${COMPANY_NAME}" <${user}>`,
      to: data.email,
      subject: `Добро пожаловать в ${COMPANY_SHORT}!`,
      html,
    });
  } catch (error) {
    logger.error("Welcome email error:", error);
  }
}

// ─── Status update email ───

export async function sendStatusUpdateEmail(data: {
  name: string;
  email: string;
  requestId: number;
  status: string;
  adminNotes?: string | null;
}) {
  const result = createTransporter();
  if (!result) return;
  const { transporter, user } = result;

  const { html, statusLabel } = buildStatusUpdateHtml(data);

  try {
    await transporter.sendMail({
      from: `"${COMPANY_NAME}" <${user}>`,
      to: data.email,
      subject: `Заявка №${data.requestId} — статус обновлён: ${statusLabel}`,
      html,
    });
  } catch (error) {
    logger.error("Status update email error:", error);
  }
}
