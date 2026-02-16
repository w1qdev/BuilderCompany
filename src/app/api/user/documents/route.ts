import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import { JWT_SECRET } from "@/lib/jwt";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as number;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const equipmentId = searchParams.get("equipmentId");

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });

    // Журнал учёта СИ — все приборы пользователя
    if (type === "journal") {
      const equipment = await prisma.equipment.findMany({
        where: { userId, category: "verification" },
        orderBy: { name: "asc" },
      });
      const html = generateJournalHtml(user, equipment);
      return new NextResponse(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Акт / Паспорт — для конкретного прибора
    if (!equipmentId) {
      return NextResponse.json({ error: "Не указан equipmentId" }, { status: 400 });
    }

    const eq = await prisma.equipment.findFirst({ where: { id: Number(equipmentId), userId } });
    if (!eq) return NextResponse.json({ error: "Оборудование не найдено" }, { status: 404 });

    if (type === "act") {
      const html = generateActHtml(user, eq);
      return new NextResponse(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (type === "passport") {
      const html = generatePassportHtml(user, eq);
      return new NextResponse(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    return NextResponse.json({ error: "Неизвестный тип документа" }, { status: 400 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

function fmt(d?: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ru-RU");
}

const style = `
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 12pt; color: #000; background: #fff; }
    @media print { body { margin: 0; } .no-print { display: none !important; } }
    .page { max-width: 800px; margin: 0 auto; padding: 20mm 15mm; }
    h1 { font-size: 16pt; text-align: center; margin-bottom: 6px; text-transform: uppercase; }
    h2 { font-size: 13pt; text-align: center; margin-bottom: 20px; }
    .meta { text-align: right; font-size: 10pt; color: #555; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 14px 0; }
    th, td { border: 1px solid #000; padding: 6px 10px; font-size: 11pt; }
    th { background: #f5f5f5; font-weight: bold; text-align: left; }
    .label { width: 45%; font-weight: bold; background: #fafafa; }
    .sign-row { display: flex; justify-content: space-between; margin-top: 40px; gap: 30px; }
    .sign-block { flex: 1; }
    .sign-line { border-bottom: 1px solid #000; margin-top: 30px; margin-bottom: 4px; }
    .sign-hint { font-size: 9pt; color: #555; text-align: center; }
    .print-btn { position: fixed; top: 16px; right: 16px; padding: 10px 20px; background: #e97a30;
      color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 13pt; z-index: 100; }
    .print-btn:hover { background: #d4692a; }
    .section-title { font-size: 12pt; font-weight: bold; margin: 18px 0 6px; border-bottom: 2px solid #000; padding-bottom: 4px; }
    .footer-note { font-size: 9pt; color: #555; margin-top: 30px; border-top: 1px solid #ccc; padding-top: 10px; }
  </style>
`;

function printScript() {
  return `<button class="print-btn no-print" onclick="window.print()">Печать / PDF</button>`;
}

// ─── АКТ ВВОДА В ЭКСПЛУАТАЦИЮ ────────────────────────────────────────────────
function generateActHtml(user: { name: string; company?: string | null }, eq: { name: string; type?: string | null; serialNumber?: string | null; registryNumber?: string | null; verificationDate?: Date | null; nextVerification?: Date | null; interval: number; notes?: string | null }) {
  const today = new Date().toLocaleDateString("ru-RU");
  const company = user.company || "_____________________";

  return `<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"><title>Акт ввода в эксплуатацию — ${eq.name}</title>${style}</head><body>
${printScript()}
<div class="page">
  <div class="meta">Дата составления: ${today}</div>
  <h1>Акт ввода в эксплуатацию</h1>
  <h2>средства измерений</h2>

  <p style="margin:12px 0">Настоящий акт составлен о том, что в организации <strong>${company}</strong> введено в эксплуатацию следующее средство измерений:</p>

  <div class="section-title">1. Сведения о СИ</div>
  <table>
    <tr><td class="label">Наименование</td><td>${eq.name}</td></tr>
    <tr><td class="label">Тип / Модель</td><td>${eq.type || "—"}</td></tr>
    <tr><td class="label">Серийный номер</td><td>${eq.serialNumber || "—"}</td></tr>
    <tr><td class="label">Регистрационный номер ФГИС</td><td>${eq.registryNumber || "—"}</td></tr>
    <tr><td class="label">Дата поверки</td><td>${fmt(eq.verificationDate)}</td></tr>
    <tr><td class="label">Следующая поверка</td><td>${fmt(eq.nextVerification)}</td></tr>
    <tr><td class="label">Межповерочный интервал</td><td>${eq.interval} мес.</td></tr>
  </table>

  <div class="section-title">2. Заключение</div>
  <p style="margin:10px 0">СИ проверено, принято в эксплуатацию. Поверка выполнена в установленные сроки. Прибор соответствует требованиям нормативной документации.</p>
  ${eq.notes ? `<p style="margin:8px 0"><em>Примечание: ${eq.notes}</em></p>` : ""}

  <div class="sign-row">
    <div class="sign-block">
      <div class="sign-hint">Ответственный за метрологию</div>
      <div class="sign-line"></div>
      <div class="sign-hint">подпись / дата</div>
    </div>
    <div class="sign-block">
      <div class="sign-hint">Руководитель подразделения</div>
      <div class="sign-line"></div>
      <div class="sign-hint">подпись / дата</div>
    </div>
    <div class="sign-block">
      <div class="sign-hint">М.П. организации</div>
      <div class="sign-line"></div>
      <div class="sign-hint">&nbsp;</div>
    </div>
  </div>

  <div class="footer-note">Акт составлен в 2 экземплярах. Хранится у ответственного за метрологическое обеспечение.</div>
</div>
</body></html>`;
}

// ─── ПАСПОРТ СИ ──────────────────────────────────────────────────────────────
function generatePassportHtml(user: { name: string; company?: string | null }, eq: { name: string; type?: string | null; serialNumber?: string | null; registryNumber?: string | null; verificationDate?: Date | null; nextVerification?: Date | null; interval: number; notes?: string | null }) {
  const company = user.company || "_____________________";
  return `<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"><title>Паспорт СИ — ${eq.name}</title>${style}</head><body>
${printScript()}
<div class="page">
  <h1>Паспорт</h1>
  <h2>средства измерений</h2>

  <div class="section-title">Общие сведения</div>
  <table>
    <tr><td class="label">Организация-владелец</td><td>${company}</td></tr>
    <tr><td class="label">Наименование СИ</td><td>${eq.name}</td></tr>
    <tr><td class="label">Тип / Модель</td><td>${eq.type || "—"}</td></tr>
    <tr><td class="label">Серийный (заводской) номер</td><td>${eq.serialNumber || "—"}</td></tr>
    <tr><td class="label">Регистрационный номер ФГИС «Аршин»</td><td>${eq.registryNumber || "—"}</td></tr>
  </table>

  <div class="section-title">Метрологические характеристики</div>
  <table>
    <tr><td class="label">Межповерочный интервал (МПИ)</td><td>${eq.interval} мес.</td></tr>
    <tr><td class="label">Дата последней поверки</td><td>${fmt(eq.verificationDate)}</td></tr>
    <tr><td class="label">Дата следующей поверки</td><td>${fmt(eq.nextVerification)}</td></tr>
    <tr><td class="label">Орган, проводивший поверку</td><td>_________________________</td></tr>
    <tr><td class="label">№ свидетельства о поверке</td><td>_________________________</td></tr>
  </table>

  <div class="section-title">История поверок</div>
  <table>
    <tr>
      <th>Дата поверки</th>
      <th>Орган поверки</th>
      <th>№ свидетельства</th>
      <th>Пригоден / Не пригоден</th>
      <th>Подпись</th>
    </tr>
    <tr><td>${fmt(eq.verificationDate)}</td><td></td><td></td><td>Пригоден</td><td></td></tr>
    <tr><td></td><td></td><td></td><td></td><td></td></tr>
    <tr><td></td><td></td><td></td><td></td><td></td></tr>
    <tr><td></td><td></td><td></td><td></td><td></td></tr>
  </table>

  ${eq.notes ? `<p style="margin:12px 0"><strong>Примечания:</strong> ${eq.notes}</p>` : ""}

  <div class="sign-row">
    <div class="sign-block">
      <div class="sign-hint">Метролог / Ответственный</div>
      <div class="sign-line"></div>
      <div class="sign-hint">подпись / дата</div>
    </div>
    <div class="sign-block">
      <div class="sign-hint">М.П.</div>
      <div class="sign-line"></div>
      <div class="sign-hint">&nbsp;</div>
    </div>
  </div>
</div>
</body></html>`;
}

// ─── ЖУРНАЛ УЧЁТА СИ ─────────────────────────────────────────────────────────
function generateJournalHtml(user: { name: string; company?: string | null }, equipment: Array<{ id: number; name: string; type?: string | null; serialNumber?: string | null; registryNumber?: string | null; verificationDate?: Date | null; nextVerification?: Date | null; interval: number; status: string }>) {
  const today = new Date().toLocaleDateString("ru-RU");
  const company = user.company || "_____________________";
  const rows = equipment.map((eq, i) => `
    <tr>
      <td style="text-align:center">${i + 1}</td>
      <td>${eq.name}</td>
      <td>${eq.type || "—"}</td>
      <td>${eq.serialNumber || "—"}</td>
      <td>${eq.registryNumber || "—"}</td>
      <td style="text-align:center">${eq.interval} мес.</td>
      <td style="text-align:center">${fmt(eq.verificationDate)}</td>
      <td style="text-align:center">${fmt(eq.nextVerification)}</td>
      <td style="text-align:center">${eq.status === "active" ? "Активен" : eq.status === "overdue" ? "Просрочен" : "Неактивен"}</td>
    </tr>`).join("");

  return `<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"><title>Журнал учёта СИ — ${company}</title>${style}
  <style>
    table th { font-size: 10pt; }
    table td { font-size: 10pt; }
  </style>
  </head><body>
${printScript()}
<div class="page">
  <h1>Журнал учёта средств измерений</h1>
  <h2>${company}</h2>
  <div class="meta">Дата составления: ${today} | Всего записей: ${equipment.length}</div>

  <table>
    <thead>
      <tr>
        <th style="width:4%">№</th>
        <th>Наименование СИ</th>
        <th>Тип</th>
        <th>Серийный №</th>
        <th>Рег. № ФГИС</th>
        <th style="width:8%">МПИ</th>
        <th style="width:10%">Дата поверки</th>
        <th style="width:10%">Следующая поверка</th>
        <th style="width:9%">Статус</th>
      </tr>
    </thead>
    <tbody>
      ${rows || `<tr><td colspan="9" style="text-align:center;color:#888">Нет данных</td></tr>`}
    </tbody>
  </table>

  <div class="sign-row">
    <div class="sign-block">
      <div class="sign-hint">Ответственный за метрологию</div>
      <div class="sign-line"></div>
      <div class="sign-hint">подпись / дата</div>
    </div>
    <div class="sign-block">
      <div class="sign-hint">Руководитель</div>
      <div class="sign-line"></div>
      <div class="sign-hint">подпись / дата</div>
    </div>
  </div>

  <div class="footer-note">Журнал сформирован автоматически в системе ЦСМ — Центр Стандартизации и Метрологии.</div>
</div>
</body></html>`;
}
