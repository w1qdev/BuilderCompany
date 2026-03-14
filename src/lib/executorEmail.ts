import {
  createTransporter,
  type NotificationItem,
  type FileData,
  resolveAttachments,
  generateExcelBuffer,
  escapeHtml,
} from "@/lib/email/transport";
import { COMPANY_NAME, COMPANY_SHORT, COLORS } from "@/lib/email/constants";
import logger from "@/lib/logger";

interface ExecutorEmailData {
  executorName: string;
  executorEmail: string;
  requestId: number;
  executorRequestId: number;
  clientCompany: string;
  clientInn?: string;
  items: NotificationItem[];
  message?: string;
  files?: FileData[];
  customSubject?: string;
}

export async function sendExecutorEmail(
  data: ExecutorEmailData
): Promise<string | null> {
  const result = createTransporter();
  if (!result) {
    logger.info("Email not configured, skipping executor notification");
    return null;
  }
  const { transporter, user } = result;

  const code = `[CSM-${data.requestId}-${data.executorRequestId}]`;
  const subject = data.customSubject
    ? (data.customSubject.includes(code) ? data.customSubject : `${data.customSubject} ${code}`)
    : `Заявка на поверку ${code} — ${data.clientCompany}`;

  // Build items table HTML
  const itemsHtml = data.items
    .map(
      (item, idx) => `
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #f0f0f0;text-align:center;color:#666;font-size:13px;">${idx + 1}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f0f0f0;font-size:13px;">${escapeHtml(item.service)}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f0f0f0;font-size:13px;">${item.object ? escapeHtml(item.object) : "—"}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f0f0f0;font-size:13px;">${item.fabricNumber ? escapeHtml(item.fabricNumber) : "—"}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f0f0f0;font-size:13px;">${item.registry ? escapeHtml(item.registry) : "—"}</td>
      </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="ru">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <div style="max-width:640px;margin:0 auto;padding:24px 16px;">
    <div style="background:linear-gradient(135deg,${COLORS.headerDark} 0%,${COLORS.headerDarkEnd} 100%);border-radius:16px 16px 0 0;padding:28px 32px;text-align:center;">
      <h1 style="margin:0 0 6px;font-size:20px;color:#fff;font-weight:700;">Запрос на выполнение работ</h1>
      <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.5);">${code} &middot; ${COMPANY_SHORT}</p>
    </div>
    <div style="background:#fff;padding:24px 32px;border-left:1px solid #eee;border-right:1px solid #eee;">
      <p style="font-size:14px;color:#333;">Уважаемые коллеги,</p>
      <p style="font-size:14px;color:#555;line-height:1.6;">
        ${COMPANY_NAME} просит вас рассмотреть возможность выполнения следующих работ
        для организации <strong>${escapeHtml(data.clientCompany)}</strong>${data.clientInn ? ` (ИНН: ${escapeHtml(data.clientInn)})` : ""}.
      </p>
      ${data.message ? `<div style="background:#fafafa;border-left:3px solid ${COLORS.primary};padding:14px 18px;border-radius:0 8px 8px 0;font-size:14px;color:#444;line-height:1.6;margin:16px 0;">${escapeHtml(data.message)}</div>` : ""}
      <h2 style="margin:20px 0 12px;font-size:15px;color:#333;text-transform:uppercase;letter-spacing:0.5px;">Позиции (${data.items.length})</h2>
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#f9f9f9;">
              <th style="padding:10px 14px;font-size:12px;color:#888;text-align:center;border-bottom:2px solid #eee;">№</th>
              <th style="padding:10px 14px;font-size:12px;color:#888;text-align:left;border-bottom:2px solid #eee;">Услуга</th>
              <th style="padding:10px 14px;font-size:12px;color:#888;text-align:left;border-bottom:2px solid #eee;">СИ</th>
              <th style="padding:10px 14px;font-size:12px;color:#888;text-align:left;border-bottom:2px solid #eee;">Зав. №</th>
              <th style="padding:10px 14px;font-size:12px;color:#888;text-align:left;border-bottom:2px solid #eee;">Реестр</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
      </div>
      <p style="font-size:14px;color:#555;margin:24px 0 0;line-height:1.6;">
        Просим направить коммерческое предложение и счёт на оплату в ответ на это письмо.
      </p>
    </div>
    <div style="background:#f9f9fb;border-radius:0 0 16px 16px;padding:20px 32px;border:1px solid #eee;border-top:none;text-align:center;">
      <p style="margin:0;font-size:12px;color:#999;">Пожалуйста, сохраните код ${code} в теме при ответе</p>
      <p style="margin:6px 0 0;font-size:12px;color:#bbb;">${COMPANY_SHORT} — ${COMPANY_NAME}</p>
    </div>
  </div>
</body>
</html>`;

  // Build attachments
  const attachments: import("nodemailer").SendMailOptions["attachments"] = [];

  try {
    const excelBuffer = await generateExcelBuffer(
      data.items,
      data.clientCompany,
      data.clientInn,
      data.message
    );
    const dateStr = new Date().toISOString().split("T")[0];
    attachments.push({
      filename: `Заявка_${data.requestId}_${dateStr}.xlsx`,
      content: excelBuffer,
      contentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  } catch (err) {
    logger.error("Failed to generate Excel for executor:", err);
  }

  if (data.files && data.files.length > 0) {
    const clientAttachments = await resolveAttachments(data.files);
    if (clientAttachments && clientAttachments.length > 0) {
      attachments.push(...clientAttachments);
    }
  }

  try {
    const info = await transporter.sendMail({
      from: `"${COMPANY_SHORT} — Заявки" <${user}>`,
      to: data.executorEmail,
      subject,
      html,
      attachments,
    });
    return info.messageId || null;
  } catch (error) {
    logger.error("Executor email error:", error);
    return null;
  }
}
