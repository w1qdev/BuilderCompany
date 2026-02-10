import nodemailer from "nodemailer";

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

function renderItemsHtml(items: NotificationItem[]): string {
  return items.map((item, idx) => {
    const rows = [
      `<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Услуга</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(item.service)}</td></tr>`,
      item.poverk ? `<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Тип поверки</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(item.poverk)}</td></tr>` : "",
      item.object ? `<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Наименование СИ</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(item.object)}</td></tr>` : "",
      item.fabricNumber ? `<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Заводской номер</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(item.fabricNumber)}</td></tr>` : "",
      item.registry ? `<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Номер реестра</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(item.registry)}</td></tr>` : "",
    ].filter(Boolean).join("\n");

    return `
      <h3 style="margin: 16px 0 8px 0;">Позиция ${idx + 1}</h3>
      <table style="border-collapse: collapse; width: 100%;">
        ${rows}
      </table>
    `;
  }).join("");
}

function renderItemsConfirmationHtml(items: NotificationItem[]): string {
  return items.map((item, idx) => {
    return `
      <div style="background: #fdf5f0; border-radius: 8px; padding: 16px; margin: 12px 0;">
        <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #333;">Позиция ${idx + 1}</p>
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #666;"><strong>Услуга:</strong> ${escapeHtml(item.service)}</p>
        ${item.object ? `<p style="margin: 0 0 8px 0; font-size: 14px; color: #666;"><strong>Наименование СИ:</strong> ${escapeHtml(item.object)}</p>` : ""}
        ${item.fabricNumber ? `<p style="margin: 0 0 8px 0; font-size: 14px; color: #666;"><strong>Заводской номер:</strong> ${escapeHtml(item.fabricNumber)}</p>` : ""}
        ${item.registry ? `<p style="margin: 0 0 8px 0; font-size: 14px; color: #666;"><strong>Номер реестра:</strong> ${escapeHtml(item.registry)}</p>` : ""}
        ${item.poverk ? `<p style="margin: 0; font-size: 14px; color: #666;"><strong>Тип поверки:</strong> ${escapeHtml(item.poverk)}</p>` : ""}
      </div>
    `;
  }).join("");
}

export async function sendEmailNotification(data: {
  name: string;
  phone: string;
  email: string;
  message?: string;
  items: NotificationItem[];
  toEmail?: string;
}) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const notifyEmail = process.env.NOTIFY_EMAIL;

  if (!host || !user || !pass || host === "smtp.example.com") {
    console.log("Email not configured, skipping notification");
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const servicesSummary = data.items.map(i => i.service).join(", ");

  const html = `
    <h2>Новая заявка с сайта</h2>
    <table style="border-collapse: collapse; width: 100%;">
      <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Имя</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(data.name)}</td></tr>
      <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Телефон</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(data.phone)}</td></tr>
      <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Email</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(data.email)}</td></tr>
      ${data.message ? `<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Сообщение</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(data.message)}</td></tr>` : ""}
    </table>
    ${renderItemsHtml(data.items)}
  `;

  try {
    await transporter.sendMail({
      from: user,
      to: data.toEmail || notifyEmail || user,
      subject: `Новая заявка: ${escapeHtml(servicesSummary)} — ${escapeHtml(data.name)}`,
      html,
    });
  } catch (error) {
    console.error("Email notification error:", error);
  }
}

export async function sendConfirmationEmail(data: {
  name: string;
  email: string;
  items: NotificationItem[];
}) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass || host === "smtp.example.com") {
    console.log("Email not configured, skipping confirmation");
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const servicesSummary = data.items.map(i => i.service).join(", ");

  const html = `
    <div style="max-width: 560px; margin: 0 auto; font-family: Arial, sans-serif; color: #333;">
      <div style="background: linear-gradient(135deg, #e8733a, #d4572a); padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 22px;">Центр Стандартизации и Метрологии</h1>
      </div>
      <div style="background: #fff; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #eee; border-top: none;">
        <p style="font-size: 16px; margin-top: 0;">Уважаемый <strong>${escapeHtml(data.name)}</strong>,</p>
        <p>Благодарим вас за обращение. Ваша заявка успешно принята к рассмотрению.</p>
        <p>Наши специалисты свяжутся с вами в ближайшее время для уточнения деталей и согласования сроков.</p>
        ${renderItemsConfirmationHtml(data.items)}
        <p style="color: #888; font-size: 13px; margin-bottom: 0;">Если вы задали вопрос по ошибке, пожалуйста, проигнорируйте это письмо.</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Центр Стандартизации и Метрологии" <${user}>`,
      to: data.email,
      subject: `Заявка принята — ${escapeHtml(servicesSummary)}`,
      html,
    });
  } catch (error) {
    console.error("Confirmation email error:", error);
  }
}
