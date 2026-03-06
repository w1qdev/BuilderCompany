import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminPassword } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

const MAX_API_BASE = "https://platform-api.max.ru";

export async function POST(req: NextRequest) {
  const headerPassword = req.headers.get("x-admin-password");
  if (!headerPassword || !(await verifyAdminPassword(headerPassword))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message } = await req.json();
  if (!message || typeof message !== "string" || message.length > 2000) {
    return NextResponse.json({ error: "Сообщение обязательно (макс. 2000 символов)" }, { status: 400 });
  }

  const token = process.env.MAX_BOT_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Max бот не настроен" }, { status: 500 });
  }

  const maxUsers = await prisma.maxUser.findMany();
  let sent = 0;

  for (const mu of maxUsers) {
    try {
      await fetch(`${MAX_API_BASE}/messages?user_id=${mu.maxUserId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({ text: message, format: "markdown", notify: true }),
      });
      sent++;
    } catch (error) {
      console.error(`Broadcast error for maxUserId ${mu.maxUserId}:`, error);
    }
  }

  return NextResponse.json({ success: true, sent, total: maxUsers.length });
}
