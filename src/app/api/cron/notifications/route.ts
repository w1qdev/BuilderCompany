import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationReminderEmail } from "@/lib/email";
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  const provided = request.headers.get("x-cron-secret");
  if (provided !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Single query: get all un-notified equipment with user data (fixes N+1)
    const allEquipment = await prisma.equipment.findMany({
      where: {
        notified: false,
        ignored: false,
        nextVerification: { gte: today },
        user: { email: { not: "" } },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, notifyDays: true, telegramChatId: true },
        },
      },
    });

    // Group equipment by user
    const byUser = new Map<number, { user: (typeof allEquipment)[0]["user"]; equipment: typeof allEquipment }>();
    for (const eq of allEquipment) {
      if (!eq.user) continue;
      const existing = byUser.get(eq.user.id);
      if (existing) {
        existing.equipment.push(eq);
      } else {
        byUser.set(eq.user.id, { user: eq.user, equipment: [eq] });
      }
    }

    let sentCount = 0;
    const notifiedIds: number[] = [];

    for (const [, { user, equipment }] of byUser) {
      // Parse user's notification days (default: 30, 14, 7)
      const days = (user.notifyDays || "30,14,7")
        .split(",")
        .map((d) => parseInt(d.trim()))
        .filter((d) => !isNaN(d) && d > 0);

      if (days.length === 0) continue;

      // Filter: only equipment within threshold days
      const dueEquipment = equipment.filter((eq) => {
        if (!eq.nextVerification) return false;
        const daysUntil = Math.round(
          (new Date(eq.nextVerification).getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
        );
        return days.some((d) => daysUntil <= d);
      });

      if (dueEquipment.length === 0) continue;

      try {
        await sendVerificationReminderEmail({
          userName: user.name,
          email: user.email,
          equipment: dueEquipment.map((eq) => ({
            name: eq.name,
            type: eq.type,
            serialNumber: eq.serialNumber,
            nextVerification: eq.nextVerification!,
            category: eq.category,
          })),
        });

        // Send Telegram notification if chat ID is set
        if (user.telegramChatId) {
          try {
            const eqList = dueEquipment.map(eq =>
              `• ${eq.name}${eq.type ? ` (${eq.type})` : ""} — до ${eq.nextVerification!.toLocaleDateString("ru-RU")}`
            ).join("\n");
            await sendTelegramMessage(
              `🔔 Напоминание о поверке\n\n${user.name}, у вас ${dueEquipment.length} ед. оборудования требуют внимания:\n\n${eqList}`,
              user.telegramChatId
            );
          } catch (tgError) {
            console.error(`Failed to send Telegram to ${user.telegramChatId}:`, tgError);
          }
        }

        notifiedIds.push(...dueEquipment.map((eq) => eq.id));
        sentCount++;
      } catch (error) {
        console.error(`Failed to send reminder to ${user.email}:`, error);
      }
    }

    // Mark equipment as notified
    if (notifiedIds.length > 0) {
      await prisma.equipment.updateMany({
        where: { id: { in: notifiedIds } },
        data: { notified: true },
      });
    }

    // Cleanup stale records: expired verification codes (older than 24h) and old activity logs (older than 90 days)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const [deletedCodes, deletedLogs] = await Promise.all([
      prisma.verificationCode.deleteMany({
        where: { OR: [{ expiresAt: { lt: oneDayAgo } }, { used: true, createdAt: { lt: oneDayAgo } }] },
      }),
      prisma.activityLog.deleteMany({
        where: { createdAt: { lt: ninetyDaysAgo } },
      }),
    ]);

    return NextResponse.json({
      sent: sentCount,
      equipmentNotified: notifiedIds.length,
      cleanup: { deletedCodes: deletedCodes.count, deletedLogs: deletedLogs.count },
    });
  } catch (error) {
    console.error("Cron notification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
