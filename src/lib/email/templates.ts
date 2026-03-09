/**
 * HTML email template builders.
 *
 * Each function returns a plain HTML string ready for Nodemailer's `html` field.
 * All user-supplied values MUST be pre-escaped with `escapeHtml()` by the caller,
 * or escaped inline here where raw data is received.
 */

import { escapeHtml, type NotificationItem, type FileData } from "./transport";
import {
  COMPANY_NAME,
  COMPANY_SHORT,
  COMPANY_TAGLINE,
  COMPANY_PHONE,
  COMPANY_PHONE_RAW,
  COMPANY_EMAIL,
  COMPANY_SITE,
  COMPANY_URL,
  COLORS,
} from "./constants";

// ─── Admin notification template ───

export interface AdminEmailTemplateData {
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
}

export function buildAdminNotificationHtml(data: AdminEmailTemplateData): string {
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

  return `
<!DOCTYPE html>
<html lang="ru">
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background: #f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
  <div style="max-width: 640px; margin: 0 auto; padding: 24px 16px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, ${COLORS.headerDark} 0%, ${COLORS.headerDarkEnd} 100%); border-radius: 16px 16px 0 0; padding: 28px 32px; text-align: center;">
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
            <td style="padding: 12px 16px; border-bottom: 1px solid #eee;"><a href="tel:${escapeHtml(data.phone)}" style="color: ${COLORS.primary}; text-decoration: none;">${escapeHtml(data.phone)}</a></td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; background: #f9f9f9; font-weight: 600; color: #555; border-bottom: 1px solid #eee;">Email</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #eee;"><a href="mailto:${escapeHtml(data.email)}" style="color: ${COLORS.primary}; text-decoration: none;">${escapeHtml(data.email)}</a></td>
          </tr>
          ${contractHtml}
        </table>
      </div>

      ${data.message ? `
      <!-- Message -->
      <div style="padding: 0 32px 16px;">
        <h2 style="margin: 0 0 12px 0; font-size: 15px; color: #333; text-transform: uppercase; letter-spacing: 0.5px;">Сообщение</h2>
        <div style="background: #fafafa; border-left: 3px solid ${COLORS.primary}; padding: 14px 18px; border-radius: 0 8px 8px 0; font-size: 14px; color: #444; line-height: 1.6;">
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

      ${(() => {
        const allFiles = data.files && data.files.length > 0 ? data.files : (data.fileName ? [{ fileName: data.fileName, filePath: data.filePath! }] : []);
        if (allFiles.length === 0) return "";
        const fileList = allFiles.map(f => `<strong>${escapeHtml(f.fileName)}</strong>`).join(", ");
        return `
      <!-- File attachment note -->
      <div style="padding: 0 32px 24px;">
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 14px 18px; font-size: 13px; color: #1e40af;">
          &#128206; Прикрепленные файлы клиента (${allFiles.length}): ${fileList} — во вложении письма
        </div>
      </div>`;
      })()}
    </div>

    <!-- Footer -->
    <div style="background: #f9f9fb; border-radius: 0 0 16px 16px; padding: 20px 32px; border: 1px solid #eee; border-top: none; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #999;">Excel-файл с позициями заявки во вложении</p>
      <p style="margin: 6px 0 0 0; font-size: 12px; color: #bbb;">${COMPANY_SHORT} — ${COMPANY_NAME}</p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Verification reminder template ───

export interface VerificationReminderTemplateData {
  userName: string;
  equipment: { name: string; type: string | null; serialNumber: string | null; nextVerification: Date; category: string }[];
}

export function buildVerificationReminderHtml(data: VerificationReminderTemplateData): string {
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
      <td style="padding: 10px 14px; border-bottom: 1px solid #f0f0f0; font-size: 13px; font-weight: 600; color: ${COLORS.primary};">${new Date(eq.nextVerification).toLocaleDateString("ru-RU")}</td>
    </tr>`,
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="ru">
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background: #f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
  <div style="max-width: 640px; margin: 0 auto; padding: 24px 16px;">
    <div style="background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%); border-radius: 16px 16px 0 0; padding: 28px 32px; text-align: center;">
      <h1 style="margin: 0 0 6px 0; font-size: 20px; color: #fff; font-weight: 700;">Напоминание о поверке</h1>
      <p style="margin: 0; font-size: 13px; color: rgba(255,255,255,0.7);">${COMPANY_NAME}</p>
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
        <a href="${COMPANY_URL}/dashboard/equipment" style="display: inline-block; background: linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark}); color: #fff; text-decoration: none; padding: 12px 32px; border-radius: 12px; font-size: 14px; font-weight: 600;">Оформить заявку</a>
      </div>
      <p style="font-size: 13px; color: #888; margin: 0;">Вы можете создать заявку на поверку прямо из личного кабинета.</p>
    </div>
    <div style="background: #f9f9fb; border-radius: 0 0 16px 16px; padding: 20px 32px; border: 1px solid #eee; border-top: none; text-align: center;">
      <p style="margin: 0 0 4px 0; font-size: 12px; color: #bbb;">${COMPANY_SHORT} — ${COMPANY_NAME}</p>
      <p style="margin: 0; font-size: 11px; color: #ddd;">${COMPANY_PHONE} &middot; ${COMPANY_EMAIL}</p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Password reset template ───

export function buildPasswordResetHtml(resetUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="ru">
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background: #f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 24px 16px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%); border-radius: 16px 16px 0 0; padding: 36px 32px; text-align: center;">
      <h1 style="color: #fff; margin: 0 0 8px 0; font-size: 22px; font-weight: 700;">Сброс пароля</h1>
      <p style="color: rgba(255,255,255,0.7); margin: 0; font-size: 13px;">${COMPANY_NAME}</p>
    </div>

    <!-- Body -->
    <div style="background: #ffffff; padding: 32px; border-left: 1px solid #eee; border-right: 1px solid #eee;">
      <p style="font-size: 14px; color: #333; margin: 0 0 16px 0; line-height: 1.6;">
        Вы запросили сброс пароля для вашего аккаунта. Нажмите кнопку ниже, чтобы установить новый пароль.
      </p>
      <p style="font-size: 14px; color: #555; margin: 0 0 24px 0; line-height: 1.6;">
        Ссылка действительна в течение <strong>1 часа</strong>.
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${escapeHtml(resetUrl)}" style="display: inline-block; background: linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark}); color: #fff; text-decoration: none; padding: 14px 40px; border-radius: 12px; font-size: 15px; font-weight: 600;">
          Сбросить пароль
        </a>
      </div>

      <div style="background: #fafafa; border-left: 3px solid ${COLORS.primary}; padding: 14px 18px; border-radius: 0 8px 8px 0; font-size: 13px; color: #888; line-height: 1.6; margin-top: 24px;">
        Если вы не запрашивали сброс пароля — просто проигнорируйте это письмо. Ваш пароль останется без изменений.
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #f9f9fb; border-radius: 0 0 16px 16px; padding: 20px 32px; border: 1px solid #eee; border-top: none; text-align: center;">
      <p style="margin: 0 0 4px 0; font-size: 12px; color: #bbb;">${COMPANY_SHORT} — ${COMPANY_NAME}</p>
      <p style="margin: 0; font-size: 11px; color: #ddd;">Если вы получили это письмо по ошибке, пожалуйста, проигнорируйте его.</p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Customer confirmation template ───

export interface ConfirmationTemplateData {
  name: string;
  requestId?: number;
  items: NotificationItem[];
}

export function buildConfirmationHtml(data: ConfirmationTemplateData): string {
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

  return `
<!DOCTYPE html>
<html lang="ru">
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background: #f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 24px 16px;">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%); border-radius: 16px 16px 0 0; padding: 36px 32px; text-align: center;">
      <h1 style="color: #fff; margin: 0 0 8px 0; font-size: 22px; font-weight: 700; letter-spacing: -0.3px;">${COMPANY_NAME}</h1>
      <p style="color: rgba(255,255,255,0.7); margin: 0; font-size: 13px;">${COMPANY_TAGLINE}</p>
    </div>

    <!-- Body -->
    <div style="background: #ffffff; padding: 0; border-left: 1px solid #eee; border-right: 1px solid #eee;">

      <!-- Greeting -->
      <div style="padding: 32px 32px 0;">
        <p style="font-size: 16px; color: #333; margin: 0 0 16px 0; line-height: 1.5;">Уважаемый(-ая) <strong>${escapeHtml(data.name)}</strong>,</p>
        <p style="font-size: 14px; color: #555; margin: 0 0 12px 0; line-height: 1.6;">Благодарим вас за обращение! Ваша заявка успешно принята и зарегистрирована${data.requestId ? ` под номером <strong style="color: ${COLORS.primary};">№${data.requestId}</strong>` : ""}.</p>
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
            <td style="padding: 4px 0; font-size: 13px;"><a href="tel:${COMPANY_PHONE_RAW}" style="color: ${COLORS.primary}; text-decoration: none; font-weight: 600;">${COMPANY_PHONE}</a></td>
          </tr>
          <tr>
            <td style="padding: 4px 12px 4px 0; font-size: 13px; color: #aaa;">Email</td>
            <td style="padding: 4px 0; font-size: 13px;"><a href="mailto:${COMPANY_EMAIL}" style="color: ${COLORS.primary}; text-decoration: none; font-weight: 600;">${COMPANY_EMAIL}</a></td>
          </tr>
          <tr>
            <td style="padding: 4px 12px 4px 0; font-size: 13px; color: #aaa;">Сайт</td>
            <td style="padding: 4px 0; font-size: 13px;"><a href="${COMPANY_URL}" style="color: ${COLORS.primary}; text-decoration: none; font-weight: 600;">${COMPANY_SITE}</a></td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #f9f9fb; border-radius: 0 0 16px 16px; padding: 20px 32px; border: 1px solid #eee; border-top: none; text-align: center;">
      <p style="margin: 0 0 4px 0; font-size: 12px; color: #bbb;">${COMPANY_SHORT} — ${COMPANY_NAME}</p>
      <p style="margin: 0; font-size: 11px; color: #ddd;">Если вы получили это письмо по ошибке, пожалуйста, проигнорируйте его.</p>
    </div>

  </div>
</body>
</html>`;
}

// ─── Arshin verification template ───

export interface ArshinVerificationTemplateData {
  userName: string;
  equipment: { name: string; type: string | null; serialNumber: string | null; validDate: string; arshinUrl: string | null }[];
}

export function buildArshinVerificationHtml(data: ArshinVerificationTemplateData): string {
  const itemsHtml = data.equipment
    .map((eq, idx) => `
    <tr>
      <td style="padding: 10px 14px; border-bottom: 1px solid #f0f0f0; color: #666; font-size: 13px; text-align: center;">${idx + 1}</td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #f0f0f0; font-size: 13px; font-weight: 600;">${escapeHtml(eq.name)}</td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #f0f0f0; font-size: 13px;">${eq.type ? escapeHtml(eq.type) : '—'}</td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #f0f0f0; font-size: 13px;">${eq.serialNumber ? escapeHtml(eq.serialNumber) : '—'}</td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #f0f0f0; font-size: 13px; font-weight: 600; color: #16a34a;">${new Date(eq.validDate).toLocaleDateString("ru-RU")}</td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #f0f0f0; font-size: 13px;">${eq.arshinUrl ? `<a href="${escapeHtml(eq.arshinUrl)}" style="color: #3b82f6; text-decoration: none;">Открыть ↗</a>` : '—'}</td>
    </tr>`)
    .join("");

  return `
<!DOCTYPE html>
<html lang="ru">
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background: #f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
  <div style="max-width: 640px; margin: 0 auto; padding: 24px 16px;">
    <div style="background: linear-gradient(135deg, ${COLORS.blue} 0%, ${COLORS.blueDark} 100%); border-radius: 16px 16px 0 0; padding: 28px 32px; text-align: center;">
      <h1 style="margin: 0 0 6px 0; font-size: 20px; color: #fff; font-weight: 700;">Поверка зарегистрирована в ФГИС Аршин</h1>
      <p style="margin: 0; font-size: 13px; color: rgba(255,255,255,0.6);">${COMPANY_NAME}</p>
    </div>
    <div style="background: #ffffff; padding: 24px 32px; border-left: 1px solid #eee; border-right: 1px solid #eee;">
      <p style="font-size: 14px; color: #333; margin: 0 0 16px 0;">Уважаемый(-ая) <strong>${escapeHtml(data.userName)}</strong>,</p>
      <p style="font-size: 14px; color: #555; margin: 0 0 20px 0;">
        Результаты поверки следующего оборудования появились в базе данных ФГИС «Аршин»:
      </p>
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f0f9ff; border-bottom: 2px solid #bfdbfe;">
              <th style="padding: 10px 14px; font-size: 12px; color: #1e40af; text-align: center;">№</th>
              <th style="padding: 10px 14px; font-size: 12px; color: #1e40af; text-align: left;">Наименование</th>
              <th style="padding: 10px 14px; font-size: 12px; color: #1e40af; text-align: left;">Тип</th>
              <th style="padding: 10px 14px; font-size: 12px; color: #1e40af; text-align: left;">Зав. №</th>
              <th style="padding: 10px 14px; font-size: 12px; color: #1e40af; text-align: left;">Действует до</th>
              <th style="padding: 10px 14px; font-size: 12px; color: #1e40af; text-align: left;">Аршин</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
      </div>
      <div style="margin: 24px 0; text-align: center;">
        <a href="${COMPANY_URL}/dashboard/arshin-registry" style="display: inline-block; background: linear-gradient(135deg, ${COLORS.blue}, ${COLORS.blueDark}); color: #fff; text-decoration: none; padding: 12px 32px; border-radius: 12px; font-size: 14px; font-weight: 600;">Открыть реестр поверок</a>
      </div>
    </div>
    <div style="background: #f9f9fb; border-radius: 0 0 16px 16px; padding: 20px 32px; border: 1px solid #eee; border-top: none; text-align: center;">
      <p style="margin: 0 0 4px 0; font-size: 12px; color: #bbb;">${COMPANY_SHORT} — ${COMPANY_NAME}</p>
      <p style="margin: 0; font-size: 11px; color: #ddd;">${COMPANY_EMAIL}</p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Welcome (registration) template ───

export interface WelcomeTemplateData {
  name: string;
}

export function buildWelcomeHtml(data: WelcomeTemplateData): string {
  return `
<!DOCTYPE html>
<html lang="ru">
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background: #f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 24px 16px;">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%); border-radius: 16px 16px 0 0; padding: 36px 32px; text-align: center;">
      <h1 style="color: #fff; margin: 0 0 8px 0; font-size: 22px; font-weight: 700; letter-spacing: -0.3px;">${COMPANY_NAME}</h1>
      <p style="color: rgba(255,255,255,0.7); margin: 0; font-size: 13px;">${COMPANY_TAGLINE}</p>
    </div>

    <!-- Body -->
    <div style="background: #ffffff; padding: 0; border-left: 1px solid #eee; border-right: 1px solid #eee;">

      <!-- Welcome card -->
      <div style="padding: 0 32px; margin: 28px 0 20px;">
        <div style="background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px 24px; text-align: center;">
          <div style="font-size: 28px; margin-bottom: 8px;">&#127881;</div>
          <div style="font-size: 15px; font-weight: 700; color: #166534; margin-bottom: 4px;">Добро пожаловать!</div>
          <div style="font-size: 13px; color: #16a34a;">Ваш аккаунт успешно создан</div>
        </div>
      </div>

      <!-- Greeting -->
      <div style="padding: 0 32px;">
        <p style="font-size: 16px; color: #333; margin: 0 0 16px 0; line-height: 1.5;">Уважаемый(-ая) <strong>${escapeHtml(data.name)}</strong>,</p>
        <p style="font-size: 14px; color: #555; margin: 0 0 12px 0; line-height: 1.6;">Благодарим вас за регистрацию в личном кабинете ${COMPANY_SHORT}! Теперь вам доступны все возможности нашего сервиса.</p>
      </div>

      <!-- Features -->
      <div style="padding: 0 32px;">
        <h2 style="margin: 24px 0 16px 0; font-size: 15px; color: #333; text-transform: uppercase; letter-spacing: 0.5px;">Что доступно в личном кабинете</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px 0; vertical-align: top; width: 44px;">
              <div style="width: 32px; height: 32px; background: #fef3c7; border-radius: 8px; text-align: center; line-height: 32px; font-size: 14px;">&#128203;</div>
            </td>
            <td style="padding: 12px 0; vertical-align: top;">
              <div style="font-size: 14px; font-weight: 600; color: #333;">Учёт оборудования</div>
              <div style="font-size: 13px; color: #888; margin-top: 2px;">Ведите учёт средств измерений и испытательного оборудования</div>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; vertical-align: top; width: 44px;">
              <div style="width: 32px; height: 32px; background: #dbeafe; border-radius: 8px; text-align: center; line-height: 32px; font-size: 14px;">&#128197;</div>
            </td>
            <td style="padding: 12px 0; vertical-align: top;">
              <div style="font-size: 14px; font-weight: 600; color: #333;">Графики поверки и аттестации</div>
              <div style="font-size: 13px; color: #888; margin-top: 2px;">Контролируйте сроки поверки и аттестации с напоминаниями</div>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; vertical-align: top; width: 44px;">
              <div style="width: 32px; height: 32px; background: #dcfce7; border-radius: 8px; text-align: center; line-height: 32px; font-size: 14px;">&#128233;</div>
            </td>
            <td style="padding: 12px 0; vertical-align: top;">
              <div style="font-size: 14px; font-weight: 600; color: #333;">Подача заявок онлайн</div>
              <div style="font-size: 13px; color: #888; margin-top: 2px;">Оформляйте заявки на поверку и аттестацию прямо из личного кабинета</div>
            </td>
          </tr>
        </table>
      </div>

      <!-- CTA -->
      <div style="text-align: center; margin: 28px 0;">
        <a href="${COMPANY_URL}/dashboard" style="display: inline-block; background: linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark}); color: #fff; text-decoration: none; padding: 14px 40px; border-radius: 12px; font-size: 15px; font-weight: 600;">
          Перейти в личный кабинет
        </a>
      </div>

      <!-- Divider -->
      <div style="padding: 0 32px;">
        <hr style="border: none; border-top: 1px solid #f0f0f0; margin: 0;" />
      </div>

      <!-- Contact info -->
      <div style="padding: 20px 32px 28px;">
        <p style="font-size: 13px; color: #888; margin: 0 0 12px 0;">Если у вас есть вопросы, мы всегда на связи:</p>
        <table style="border-collapse: collapse;">
          <tr>
            <td style="padding: 4px 12px 4px 0; font-size: 13px; color: #aaa;">Телефон</td>
            <td style="padding: 4px 0; font-size: 13px;"><a href="tel:${COMPANY_PHONE_RAW}" style="color: ${COLORS.primary}; text-decoration: none; font-weight: 600;">${COMPANY_PHONE}</a></td>
          </tr>
          <tr>
            <td style="padding: 4px 12px 4px 0; font-size: 13px; color: #aaa;">Email</td>
            <td style="padding: 4px 0; font-size: 13px;"><a href="mailto:${COMPANY_EMAIL}" style="color: ${COLORS.primary}; text-decoration: none; font-weight: 600;">${COMPANY_EMAIL}</a></td>
          </tr>
          <tr>
            <td style="padding: 4px 12px 4px 0; font-size: 13px; color: #aaa;">Сайт</td>
            <td style="padding: 4px 0; font-size: 13px;"><a href="${COMPANY_URL}" style="color: ${COLORS.primary}; text-decoration: none; font-weight: 600;">${COMPANY_SITE}</a></td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #f9f9fb; border-radius: 0 0 16px 16px; padding: 20px 32px; border: 1px solid #eee; border-top: none; text-align: center;">
      <p style="margin: 0 0 4px 0; font-size: 12px; color: #bbb;">${COMPANY_SHORT} — ${COMPANY_NAME}</p>
      <p style="margin: 0; font-size: 11px; color: #ddd;">Вы получили это письмо, потому что зарегистрировались на ${COMPANY_SITE}</p>
    </div>

  </div>
</body>
</html>`;
}

// ─── Status update template ───

export interface StatusUpdateTemplateData {
  name: string;
  requestId: number;
  status: string;
  adminNotes?: string | null;
}

export function buildStatusUpdateHtml(data: StatusUpdateTemplateData, customTemplate?: string | null): { html: string; statusLabel: string } {
  const statusLabels: Record<string, { label: string; color: string; description: string }> = {
    new: {
      label: "Новая",
      color: "#3b82f6",
      description: "Статус вашей заявки изменён на «Новая».",
    },
    in_progress: {
      label: "В работе",
      color: "#f59e0b",
      description: "Ваша заявка принята в работу. Специалисты приступили к выполнению.",
    },
    pending_payment: {
      label: "Ожидает оплаты",
      color: "#eab308",
      description: "Счёт на оплату направлен. После оплаты мы приступим к выполнению работ.",
    },
    review: {
      label: "На проверке",
      color: "#8b5cf6",
      description: "Ваша заявка находится на этапе проверки.",
    },
    done: {
      label: "Завершена",
      color: "#10b981",
      description: "Ваша заявка выполнена. Документы готовы к выдаче.",
    },
    cancelled: {
      label: "Отменена",
      color: "#ef4444",
      description: "Ваша заявка была отменена.",
    },
  };

  const statusInfo = statusLabels[data.status] || { label: data.status, color: "#6b7280", description: "" };

  // Apply custom template if provided
  if (customTemplate) {
    statusInfo.description = customTemplate
      .replace(/\{name\}/g, escapeHtml(data.name))
      .replace(/\{service\}/g, "")
      .replace(/\{id\}/g, String(data.requestId))
      .replace(/\{status\}/g, statusInfo.label);
  }

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f9f5f0;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
    <div style="background:#1a1a2e;padding:24px 32px;border-radius:16px 16px 0 0;text-align:center;">
      <h1 style="margin:0;color:#ff6b35;font-size:20px;">${COMPANY_SHORT}</h1>
      <p style="margin:8px 0 0;color:#fff;opacity:0.7;font-size:13px;">${COMPANY_NAME}</p>
    </div>
    <div style="background:#fff;padding:32px;border:1px solid #eee;border-top:none;">
      <p style="font-size:16px;color:#333;">Здравствуйте, <strong>${escapeHtml(data.name)}</strong>!</p>
      <p style="color:#555;font-size:14px;">Статус вашей заявки <strong>№${data.requestId}</strong> изменён:</p>
      <div style="margin:20px 0;padding:16px 20px;background:#f8f9fa;border-left:4px solid ${statusInfo.color};border-radius:8px;">
        <p style="margin:0;font-size:18px;font-weight:bold;color:${statusInfo.color};">${statusInfo.label}</p>
        <p style="margin:8px 0 0;font-size:13px;color:#666;">${statusInfo.description}</p>
      </div>
      ${data.adminNotes ? `<div style="margin:16px 0;padding:16px;background:#fff8f3;border:1px solid #ffe0cc;border-radius:8px;"><p style="margin:0 0 6px;font-size:12px;font-weight:bold;color:#f59e0b;text-transform:uppercase;">Комментарий от специалиста:</p><p style="margin:0;font-size:14px;color:#333;">${escapeHtml(data.adminNotes)}</p></div>` : ""}
      <p style="color:#555;font-size:14px;">Если у вас есть вопросы, свяжитесь с нами.</p>
    </div>
    <div style="background:#f0ebe5;padding:16px 32px;border-radius:0 0 16px 16px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#999;">© ${COMPANY_SHORT} — ${COMPANY_NAME}</p>
    </div>
  </div>
</body>
</html>`;

  return { html, statusLabel: statusInfo.label };
}
