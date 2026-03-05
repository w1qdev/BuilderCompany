import { NextRequest, NextResponse } from "next/server";
import { createTransporter } from "@/lib/email/transport";
import { COMPANY_SHORT } from "@/lib/email/constants";
import { createRateLimiter } from "@/lib/rateLimit";
import { jwtVerify } from "jose";
import { JWT_SECRET } from "@/lib/jwt";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_FILES = 5;

const limiter = createRateLimiter({ max: 5, windowMs: 15 * 60 * 1000 });

export async function POST(request: NextRequest) {
  if (!limiter(request)) {
    return NextResponse.json(
      { error: "Слишком много сообщений. Попробуйте позже" },
      { status: 429 },
    );
  }

  const token = request.cookies.get("auth-token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
  }

  let userEmail: string;
  let userName: string;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    userEmail = payload.email as string;
    userName = (payload.name as string) || "Пользователь";
    if (!userEmail) {
      return NextResponse.json({ error: "Email не найден" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Недействительный токен" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const message = formData.get("message") as string | null;

    if (!message || message.trim().length < 5) {
      return NextResponse.json({ error: "Минимум 5 символов" }, { status: 400 });
    }
    if (message.length > 5000) {
      return NextResponse.json({ error: "Максимум 5000 символов" }, { status: 400 });
    }

    const files = formData.getAll("files") as File[];
    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: `Максимум ${MAX_FILES} файлов` }, { status: 400 });
    }

    const attachments: { filename: string; content: Buffer }[] = [];
    for (const file of files) {
      if (!file.size) continue;
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `Недопустимый тип файла: ${file.name}` },
          { status: 400 },
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `Файл слишком большой: ${file.name} (макс. 10 МБ)` },
          { status: 400 },
        );
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      attachments.push({ filename: file.name, content: buffer });
    }

    const result = createTransporter();
    if (!result) {
      return NextResponse.json(
        { error: "Email не настроен на сервере" },
        { status: 500 },
      );
    }
    const { transporter, user: smtpUser } = result;

    const now = new Date().toLocaleString("ru-RU", { timeZone: "Europe/Moscow" });
    const escapedMessage = message.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;");

    await transporter.sendMail({
      from: `"${COMPANY_SHORT} — Замечания" <${smtpUser}>`,
      to: "support@csm-center.ru",
      replyTo: userEmail,
      subject: `Замечание от ${userName} (${userEmail})`,
      attachments,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2 style="color: #e8733a;">Замечание от пользователя</h2>
          <table style="border-collapse: collapse; width: 100%; margin-bottom: 16px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #eee; font-weight: bold; width: 120px;">Имя</td>
              <td style="padding: 8px; border: 1px solid #eee;">${userName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #eee; font-weight: bold;">Email</td>
              <td style="padding: 8px; border: 1px solid #eee;"><a href="mailto:${userEmail}">${userEmail}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #eee; font-weight: bold;">Дата</td>
              <td style="padding: 8px; border: 1px solid #eee;">${now}</td>
            </tr>
            ${attachments.length > 0 ? `<tr>
              <td style="padding: 8px; border: 1px solid #eee; font-weight: bold;">Файлы</td>
              <td style="padding: 8px; border: 1px solid #eee;">${attachments.map((a) => a.filename).join(", ")}</td>
            </tr>` : ""}
          </table>
          <div style="background: #f9f9f9; border-left: 4px solid #e8733a; padding: 16px; white-space: pre-wrap;">${escapedMessage}</div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Feedback send error:", error);
    return NextResponse.json({ error: "Ошибка отправки" }, { status: 500 });
  }
}
