import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationReminderEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 },
    );
  }

  const provided = request.headers.get("x-cron-secret");
  if (provided !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    // Find equipment due for verification within 14 days, not yet notified
    const equipment = await prisma.equipment.findMany({
      where: {
        notified: false,
        nextVerification: {
          gte: now,
          lte: in14Days,
        },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (equipment.length === 0) {
      return NextResponse.json({ sent: 0, message: "No equipment due" });
    }

    // Group by user
    const byUser = new Map<
      number,
      {
        userName: string;
        email: string;
        items: typeof equipment;
      }
    >();

    for (const eq of equipment) {
      const userId = eq.userId;
      if (!byUser.has(userId)) {
        byUser.set(userId, {
          userName: eq.user.name,
          email: eq.user.email,
          items: [],
        });
      }
      byUser.get(userId)!.items.push(eq);
    }

    let sentCount = 0;
    const notifiedIds: number[] = [];

    for (const [, data] of byUser) {
      try {
        await sendVerificationReminderEmail({
          userName: data.userName,
          email: data.email,
          equipment: data.items.map((eq) => ({
            name: eq.name,
            type: eq.type,
            serialNumber: eq.serialNumber,
            registryNumber: eq.registryNumber,
            nextVerification: eq.nextVerification!,
            category: eq.category,
          })),
        });

        notifiedIds.push(...data.items.map((eq) => eq.id));
        sentCount++;
      } catch (error) {
        console.error(
          `Failed to send reminder to ${data.email}:`,
          error,
        );
      }
    }

    // Mark equipment as notified
    if (notifiedIds.length > 0) {
      await prisma.equipment.updateMany({
        where: { id: { in: notifiedIds } },
        data: { notified: true },
      });
    }

    return NextResponse.json({
      sent: sentCount,
      equipmentNotified: notifiedIds.length,
    });
  } catch (error) {
    console.error("Cron notification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
