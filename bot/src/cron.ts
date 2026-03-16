import cron from "node-cron";
import { prisma } from "./prisma";

const MAX_API_BASE = "https://platform-api.max.ru";

async function sendMaxMessage(userId: number, text: string) {
  const token = process.env.MAX_BOT_TOKEN;
  if (!token) return;

  try {
    await fetch(`${MAX_API_BASE}/messages?user_id=${userId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({ text, format: "markdown", notify: true }),
    });
  } catch (error) {
    console.error(`Max message error for user ${userId}:`, error);
  }
}

export function startCronJobs() {
  // Daily at 09:00 Moscow time
  cron.schedule("0 9 * * *", async () => {
    console.log("Running verification reminder check...");

    const now = new Date();
    const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const equipment = await prisma.equipment.findMany({
      where: {
        notified: false,
        ignored: false,
        nextVerification: { lte: in14Days, gte: now },
      },
      include: { user: true },
    });

    if (equipment.length === 0) return;

    const byUser = new Map<number, typeof equipment>();
    for (const eq of equipment) {
      if (!eq.userId) continue;
      const list = byUser.get(eq.userId) || [];
      list.push(eq);
      byUser.set(eq.userId, list);
    }

    for (const [userId, items] of byUser) {
      const maxUser = await prisma.maxUser.findFirst({ where: { userId } });
      if (!maxUser) continue;

      const lines = items.map((eq: typeof items[number]) => {
        const date = eq.nextVerification
          ? eq.nextVerification.toLocaleDateString("ru-RU")
          : "—";
        return `- ${eq.name}${eq.serialNumber ? ` (${eq.serialNumber})` : ""} — до ${date}`;
      });

      const text = `**Напоминание о поверке**\n\nСледующие СИ требуют поверки в ближайшие 14 дней:\n\n${lines.join("\n")}`;
      await sendMaxMessage(maxUser.maxUserId, text);
    }

    console.log(`Verification reminders sent to ${byUser.size} Max users`);
  }, { timezone: "Europe/Moscow" });
}
