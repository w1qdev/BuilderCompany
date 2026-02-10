import nodemailer from "nodemailer";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function sendEmailNotification(data: {
  name: string;
  phone: string;
  email: string;
  service: string;
  object?: string;
  fabricNumber?: string;
  registry?: string;
  poverk?: string;
  message?: string;
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

  const html = `
    <h2>Новая заявка с сайта</h2>
    <table style="border-collapse: collapse; width: 100%;">
      <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Имя</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(data.name)}</td></tr>
      <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Телефон</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(data.phone)}</td></tr>
      <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Email</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(data.email)}</td></tr>
      <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Услуга</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(data.service)}</td></tr>
      ${data.object ? `<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Наименование СИ</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(data.object)}</td></tr>` : ""}
      ${data.fabricNumber ? `<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Заводской номер</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(data.fabricNumber)}</td></tr>` : ""}
      ${data.registry ? `<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Номер реестра</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(data.registry)}</td></tr>` : ""}
      ${data.poverk ? `<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Тип поверки</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(data.poverk)}</td></tr>` : ""}
      ${data.message ? `<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Сообщение</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(data.message)}</td></tr>` : ""}
    </table>
  `;

  try {
    await transporter.sendMail({
      from: user,
      to: data.toEmail || notifyEmail || user,
      subject: `Новая заявка: ${escapeHtml(data.service)} — ${escapeHtml(data.name)}`,
      html,
    });
  } catch (error) {
    console.error("Email notification error:", error);
  }
}

export async function sendConfirmationEmail(data: {
  name: string;
  email: string;
  service: string;
  object?: string;
  fabricNumber?: string;
  registry?: string;
  poverk?: string;
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

  const html = `
    <div style="max-width: 560px; margin: 0 auto; font-family: Arial, sans-serif; color: #333;">
      <div style="background: linear-gradient(135deg, #e8733a, #d4572a); padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 22px;">Центр Стандартизации и Метрологии</h1>
      </div>
      <div style="background: #fff; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #eee; border-top: none;">
        <p style="font-size: 16px; margin-top: 0;">Уважаемый <strong>${escapeHtml(data.name)}</strong>,</p>
        <p>Благодарим вас за обращение. Ваша заявка по услуге <strong>${escapeHtml(data.service)}</strong> успешно принята к рассмотрению.</p>
        <p>Наши специалисты свяжутся с вами в ближайшее время для уточнения деталей и согласования сроков.</p>
        <div style="background: #fdf5f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #666;"><strong>Услуга:</strong> ${escapeHtml(data.service)}</p>
          ${data.object ? `<p style="margin: 0 0 8px 0; font-size: 14px; color: #666;"><strong>Наименование СИ:</strong> ${escapeHtml(data.object)}</p>` : ""}
          ${data.fabricNumber ? `<p style="margin: 0 0 8px 0; font-size: 14px; color: #666;"><strong>Заводской номер:</strong> ${escapeHtml(data.fabricNumber)}</p>` : ""}
          ${data.registry ? `<p style="margin: 0 0 8px 0; font-size: 14px; color: #666;"><strong>Номер реестра:</strong> ${escapeHtml(data.registry)}</p>` : ""}
          ${data.poverk ? `<p style="margin: 0; font-size: 14px; color: #666;"><strong>Тип поверки:</strong> ${escapeHtml(data.poverk)}</p>` : ""}
        </div>
        <p style="color: #888; font-size: 13px; margin-bottom: 0;">Если вы задали вопрос по ошибке, пожалуйста, проигнорируйте это письмо.</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Центр Стандартизации и Метрологии" <${user}>`,
      to: data.email,
      subject: `Заявка принята — ${escapeHtml(data.service)}`,
      html,
    });
  } catch (error) {
    console.error("Confirmation email error:", error);
  }
}
