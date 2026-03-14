import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminPassword } from "@/lib/adminAuth";
import { createRateLimiter } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const BOOL_KEYS = [
  "emailNotifyAdmin",
  "emailNotifyCustomer",
  "telegramNotify",
  "maxNotify",
];
const STRING_KEYS = [
  "notifyEmail",
  "companyPhone",
  "companyEmail",
  "companyAddress",
];
const TEMPLATE_KEYS = [
  "template_new",
  "template_in_progress",
  "template_pending_payment",
  "template_review",
  "template_done",
  "template_cancelled",
];
const RESPONSE_TEMPLATE_KEYS = [
  "response_templates",
];
const AUTOMATION_BOOL_KEYS = [
  "imapEnabled",
];
const AUTOMATION_STRING_KEYS = [
  "imapCheckInterval",
  "defaultMarkup",
  "automationMode",
];

const adminSettingsLimiter = createRateLimiter({
  max: 60,
  windowMs: 60 * 1000,
});

export async function GET(req: NextRequest) {
  if (!adminSettingsLimiter(req)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const headerPassword = req.headers.get("x-admin-password");
  if (!headerPassword || !(await verifyAdminPassword(headerPassword))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.setting.findMany({
    where: { key: { in: [...BOOL_KEYS, ...STRING_KEYS, ...TEMPLATE_KEYS, ...RESPONSE_TEMPLATE_KEYS, ...AUTOMATION_BOOL_KEYS, ...AUTOMATION_STRING_KEYS] } },
  });

  const result: Record<string, string | boolean> = {};
  for (const key of BOOL_KEYS) {
    const row = rows.find((r) => r.key === key);
    result[key] = row ? row.value === "true" : true;
  }
  for (const key of STRING_KEYS) {
    const row = rows.find((r) => r.key === key);
    result[key] = row?.value || "";
  }
  for (const key of TEMPLATE_KEYS) {
    const row = rows.find((r) => r.key === key);
    result[key] = row?.value || "";
  }
  for (const key of RESPONSE_TEMPLATE_KEYS) {
    const row = rows.find((r) => r.key === key);
    result[key] = row?.value || "";
  }
  for (const key of AUTOMATION_BOOL_KEYS) {
    const row = rows.find((r) => r.key === key);
    result[key] = row ? row.value === "true" : false;
  }
  for (const key of AUTOMATION_STRING_KEYS) {
    const row = rows.find((r) => r.key === key);
    result[key] = row?.value || "";
  }

  if (!result["automationMode"]) {
    result["automationMode"] = "semi-auto";
  }

  return NextResponse.json(result);
}

export async function PUT(req: NextRequest) {
  if (!adminSettingsLimiter(req)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const headerPassword = req.headers.get("x-admin-password");
  if (!headerPassword || !(await verifyAdminPassword(headerPassword))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  await Promise.all([
    ...BOOL_KEYS.map((key) =>
      prisma.setting.upsert({
        where: { key },
        update: { value: String(body[key] === true) },
        create: { key, value: String(body[key] === true) },
      })
    ),
    ...STRING_KEYS.map((key) =>
      prisma.setting.upsert({
        where: { key },
        update: { value: String(body[key] || "") },
        create: { key, value: String(body[key] || "") },
      })
    ),
    ...TEMPLATE_KEYS.filter((key) => body[key] !== undefined).map((key) =>
      prisma.setting.upsert({
        where: { key },
        update: { value: String(body[key] || "") },
        create: { key, value: String(body[key] || "") },
      })
    ),
    ...RESPONSE_TEMPLATE_KEYS.filter((key) => body[key] !== undefined).map((key) =>
      prisma.setting.upsert({
        where: { key },
        update: { value: String(body[key] || "") },
        create: { key, value: String(body[key] || "") },
      })
    ),
    ...AUTOMATION_BOOL_KEYS.filter((key) => body[key] !== undefined).map((key) =>
      prisma.setting.upsert({
        where: { key },
        update: { value: String(body[key] === true) },
        create: { key, value: String(body[key] === true) },
      })
    ),
    ...AUTOMATION_STRING_KEYS.filter((key) => body[key] !== undefined).map((key) =>
      prisma.setting.upsert({
        where: { key },
        update: { value: String(body[key] || "") },
        create: { key, value: String(body[key] || "") },
      })
    ),
  ]);

  return NextResponse.json({ ok: true });
}
