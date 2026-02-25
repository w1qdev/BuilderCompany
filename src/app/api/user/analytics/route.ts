import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import { JWT_SECRET } from "@/lib/jwt";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;
    if (!token) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as number;

    const now = new Date();
    const startOf12MonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const [equipment, requests, verificationRecords] = await Promise.all([
      prisma.equipment.findMany({
        where: { userId },
        select: {
          id: true,
          category: true,
          status: true,
          nextVerification: true,
          verificationDate: true,
          ignored: true,
          createdAt: true,
        },
      }),
      prisma.request.findMany({
        where: { userId },
        select: { id: true, status: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.verificationRecord.findMany({
        where: { equipment: { userId } },
        select: { date: true },
        orderBy: { date: "asc" },
      }),
    ]);

    // Equipment stats
    const totalEquipment = equipment.filter((e) => !e.ignored).length;
    const siCount = equipment.filter((e) => e.category !== "attestation" && !e.ignored).length;
    const ioCount = equipment.filter((e) => e.category === "attestation" && !e.ignored).length;
    const archivedCount = equipment.filter((e) => e.ignored).length;

    const overdueCount = equipment.filter(
      (e) => !e.ignored && e.nextVerification && new Date(e.nextVerification) < now
    ).length;

    const in30Days = new Date(now);
    in30Days.setDate(in30Days.getDate() + 30);
    const upcomingCount = equipment.filter(
      (e) =>
        !e.ignored &&
        e.nextVerification &&
        new Date(e.nextVerification) >= now &&
        new Date(e.nextVerification) <= in30Days
    ).length;

    const activeCount = totalEquipment - overdueCount - upcomingCount;

    // Requests by status
    const requestsByStatus = {
      new: requests.filter((r) => r.status === "new").length,
      in_progress: requests.filter((r) => r.status === "in_progress").length,
      done: requests.filter((r) => r.status === "done").length,
    };

    // Monthly requests for the past 12 months
    const monthlyRequests: { month: string; count: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const count = requests.filter(
        (r) => new Date(r.createdAt) >= d && new Date(r.createdAt) < next
      ).length;
      monthlyRequests.push({
        month: d.toLocaleString("ru-RU", { month: "short", year: "2-digit" }),
        count,
      });
    }

    // Upcoming verifications by month (next 6 months)
    const upcomingByMonth: { month: string; count: number }[] = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const count = equipment.filter(
        (e) =>
          !e.ignored &&
          e.nextVerification &&
          new Date(e.nextVerification) >= d &&
          new Date(e.nextVerification) < next
      ).length;
      upcomingByMonth.push({
        month: d.toLocaleString("ru-RU", { month: "short", year: "2-digit" }),
        count,
      });
    }

    // Fleet growth: equipment added per month (last 12 months)
    const fleetGrowth: { month: string; count: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const count = equipment.filter(
        (e) => new Date(e.createdAt) >= d && new Date(e.createdAt) < next
      ).length;
      fleetGrowth.push({
        month: d.toLocaleString("ru-RU", { month: "short", year: "2-digit" }),
        count,
      });
    }

    // Verifications performed per month (last 12 months)
    const verificationsPerMonth: { month: string; count: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const count = verificationRecords.filter(
        (r) => new Date(r.date) >= d && new Date(r.date) < next
      ).length;
      verificationsPerMonth.push({
        month: d.toLocaleString("ru-RU", { month: "short", year: "2-digit" }),
        count,
      });
    }

    return NextResponse.json({
      equipment: {
        total: totalEquipment,
        si: siCount,
        io: ioCount,
        archived: archivedCount,
        overdue: overdueCount,
        upcoming: upcomingCount,
        active: activeCount,
      },
      requests: {
        total: requests.length,
        byStatus: requestsByStatus,
        monthly: monthlyRequests,
      },
      upcomingByMonth,
      fleetGrowth,
      verificationsPerMonth,
    });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
