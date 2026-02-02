import nodemailer from "nodemailer";

export async function sendEmailNotification(data: {
  name: string;
  phone: string;
  email: string;
  service: string;
  message?: string;
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
      <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Имя</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.name}</td></tr>
      <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Телефон</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.phone}</td></tr>
      <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Email</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.email}</td></tr>
      <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Услуга</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.service}</td></tr>
      ${data.message ? `<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Сообщение</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.message}</td></tr>` : ""}
    </table>
  `;

  try {
    await transporter.sendMail({
      from: user,
      to: notifyEmail || user,
      subject: `Новая заявка: ${data.service} — ${data.name}`,
      html,
    });
  } catch (error) {
    console.error("Email notification error:", error);
  }
}
