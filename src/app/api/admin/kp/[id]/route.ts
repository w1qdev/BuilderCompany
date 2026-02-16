import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminPassword } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const headerPassword = req.headers.get("x-admin-password");
  if (!headerPassword || !(await verifyAdminPassword(headerPassword))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const request = await prisma.request.findUnique({
    where: { id: Number(id) },
    include: { items: true },
  });

  if (!request) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const today = new Date().toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const validUntil = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const itemsHtml = request.items && request.items.length > 0
    ? request.items.map((item, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${item.service || "—"}</td>
          <td>${item.object || "—"}</td>
          <td>${item.fabricNumber || "—"}</td>
          <td>${item.registry || "—"}</td>
          <td>${item.poverk || "—"}</td>
          <td style="text-align:right;">${request.clientPrice ? `${Number(request.clientPrice).toLocaleString("ru-RU")} ₽` : "По запросу"}</td>
        </tr>`).join("")
    : `<tr>
        <td>1</td>
        <td>${request.service || "—"}</td>
        <td>${request.object || "—"}</td>
        <td>${request.fabricNumber || "—"}</td>
        <td>${request.registry || "—"}</td>
        <td>${request.poverk || "—"}</td>
        <td style="text-align:right;">${request.clientPrice ? `${Number(request.clientPrice).toLocaleString("ru-RU")} ₽` : "По запросу"}</td>
      </tr>`;

  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>КП №${request.id} — ${request.name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #222; background: #fff; }
    .page { max-width: 800px; margin: 0 auto; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #ff6b35; padding-bottom: 20px; margin-bottom: 24px; }
    .logo-block h1 { font-size: 22px; color: #ff6b35; font-weight: 900; letter-spacing: -0.5px; }
    .logo-block p { font-size: 11px; color: #666; margin-top: 4px; }
    .kp-info { text-align: right; }
    .kp-info h2 { font-size: 18px; font-weight: 700; }
    .kp-info p { font-size: 11px; color: #666; margin-top: 2px; }
    .section { margin-bottom: 20px; }
    .section h3 { font-size: 13px; font-weight: 700; color: #ff6b35; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 6px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .info-item label { font-size: 10px; color: #999; text-transform: uppercase; display: block; }
    .info-item span { font-size: 13px; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { background: #f8f4f0; font-weight: 700; text-align: left; padding: 8px 6px; border: 1px solid #ddd; font-size: 10px; text-transform: uppercase; color: #555; }
    td { padding: 7px 6px; border: 1px solid #ddd; vertical-align: top; }
    tr:nth-child(even) td { background: #fafafa; }
    .total-row td { font-weight: 700; background: #fff8f3; border-top: 2px solid #ff6b35; }
    .conditions { background: #f8f4f0; padding: 16px; border-radius: 8px; }
    .conditions ul { list-style: none; padding: 0; }
    .conditions li { padding: 4px 0; font-size: 11px; color: #444; padding-left: 16px; position: relative; }
    .conditions li:before { content: "✓"; position: absolute; left: 0; color: #ff6b35; font-weight: 700; }
    .footer { margin-top: 32px; border-top: 1px solid #eee; padding-top: 16px; display: flex; justify-content: space-between; font-size: 10px; color: #999; }
    .signature-block { margin-top: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
    .sig-line { margin-top: 32px; border-top: 1px solid #333; padding-top: 4px; font-size: 10px; color: #666; }
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .no-print { display: none; }
      .page { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Print button (hidden when printing) -->
    <div class="no-print" style="margin-bottom:20px;text-align:right;">
      <button onclick="window.print()" style="background:#ff6b35;color:#fff;border:none;padding:8px 20px;border-radius:8px;font-size:13px;cursor:pointer;font-weight:600;">
        Печать / Сохранить PDF
      </button>
    </div>

    <!-- Header -->
    <div class="header">
      <div class="logo-block">
        <h1>ЦСМ</h1>
        <p>Центр Стандартизации и Метрологии</p>
        <p style="margin-top:6px;font-size:10px;color:#aaa;">г. Екатеринбург, ул. Маневровая, 9</p>
        <p style="font-size:10px;color:#aaa;">+7 (966) 730-30-03 · zakaz@csm-center.ru</p>
      </div>
      <div class="kp-info">
        <h2>Коммерческое предложение</h2>
        <p>№ КП-${request.id} от ${today}</p>
        <p>Действительно до: ${validUntil}</p>
      </div>
    </div>

    <!-- Client info -->
    <div class="section">
      <h3>Клиент</h3>
      <div class="info-grid">
        <div class="info-item">
          <label>Наименование / ФИО</label>
          <span>${request.name}</span>
        </div>
        ${request.company ? `<div class="info-item"><label>Организация</label><span>${request.company}</span></div>` : ""}
        <div class="info-item">
          <label>Телефон</label>
          <span>${request.phone}</span>
        </div>
        <div class="info-item">
          <label>Email</label>
          <span>${request.email}</span>
        </div>
        ${request.inn ? `<div class="info-item"><label>ИНН</label><span>${request.inn}</span></div>` : ""}
      </div>
    </div>

    <!-- Services table -->
    <div class="section">
      <h3>Перечень работ</h3>
      <table>
        <thead>
          <tr>
            <th style="width:28px;">№</th>
            <th>Вид работ</th>
            <th>Наименование СИ/ОО</th>
            <th>Зав. номер</th>
            <th>№ реестра</th>
            <th>Тип поверки</th>
            <th style="text-align:right;">Стоимость</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td colspan="6" style="text-align:right;font-size:13px;">Итого:</td>
            <td style="text-align:right;font-size:13px;">${request.clientPrice ? `${Number(request.clientPrice).toLocaleString("ru-RU")} ₽` : "По запросу"}</td>
          </tr>
        </tfoot>
      </table>
      ${request.message ? `<p style="margin-top:10px;font-size:11px;color:#666;"><strong>Примечание:</strong> ${request.message}</p>` : ""}
    </div>

    <!-- Conditions -->
    <div class="section">
      <h3>Условия</h3>
      <div class="conditions">
        <ul>
          <li>Поверка проводится в соответствии с действующими методиками поверки</li>
          <li>Срок выполнения: 1–5 рабочих дней (уточняется при оформлении заявки)</li>
          <li>Результаты вносятся в ФГИС «Аршин» (для поверки СИ)</li>
          <li>Оплата по выставленному счёту в течение 3 банковских дней</li>
          <li>Данное КП действительно в течение 14 календарных дней</li>
        </ul>
      </div>
    </div>

    <!-- Signatures -->
    <div class="signature-block">
      <div>
        <p style="font-size:11px;font-weight:700;">От исполнителя:</p>
        <p style="font-size:11px;margin-top:4px;color:#666;">ЦСМ — Центр Стандартизации и Метрологии</p>
        <div class="sig-line">Подпись / М.П.</div>
      </div>
      <div>
        <p style="font-size:11px;font-weight:700;">От заказчика:</p>
        <p style="font-size:11px;margin-top:4px;color:#666;">${request.company || request.name}</p>
        <div class="sig-line">Подпись / М.П.</div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <span>ЦСМ — csm-center.ru</span>
      <span>КП №${request.id} · Сформировано: ${today}</span>
    </div>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
