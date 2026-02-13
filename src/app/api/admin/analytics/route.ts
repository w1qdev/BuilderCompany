import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminPassword } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const password = request.headers.get("x-admin-password") || "";
  const isValid = await verifyAdminPassword(password);
  if (!isValid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const days = Math.min(Number(searchParams.get("days")) || 30, 365);

    const since = new Date();
    since.setDate(since.getDate() - days);

    // Page views by day
    const pageViews = await prisma.pageView.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, url: true },
      orderBy: { createdAt: "asc" },
    });

    // Group views by day
    const viewsByDay: Record<string, number> = {};
    const viewsByPage: Record<string, number> = {};
    for (const pv of pageViews) {
      const day = pv.createdAt.toISOString().split("T")[0];
      viewsByDay[day] = (viewsByDay[day] || 0) + 1;

      const page = pv.url.split("?")[0];
      viewsByPage[page] = (viewsByPage[page] || 0) + 1;
    }

    // Fill in missing days
    const viewsTimeline: { date: string; views: number }[] = [];
    const current = new Date(since);
    const today = new Date();
    while (current <= today) {
      const day = current.toISOString().split("T")[0];
      viewsTimeline.push({ date: day, views: viewsByDay[day] || 0 });
      current.setDate(current.getDate() + 1);
    }

    // Top pages
    const topPages = Object.entries(viewsByPage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([url, count]) => ({ url, count }));

    // Requests by day
    const requests = await prisma.request.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, status: true, clientPrice: true },
    });

    const requestsByDay: Record<string, number> = {};
    const requestsByStatus: Record<string, number> = {};
    let totalRevenue = 0;

    for (const req of requests) {
      const day = req.createdAt.toISOString().split("T")[0];
      requestsByDay[day] = (requestsByDay[day] || 0) + 1;
      requestsByStatus[req.status] = (requestsByStatus[req.status] || 0) + 1;
      if (req.status === "done" && req.clientPrice) {
        totalRevenue += req.clientPrice;
      }
    }

    const requestsTimeline: { date: string; requests: number }[] = [];
    const current2 = new Date(since);
    while (current2 <= today) {
      const day = current2.toISOString().split("T")[0];
      requestsTimeline.push({ date: day, requests: requestsByDay[day] || 0 });
      current2.setDate(current2.getDate() + 1);
    }

    // User registrations
    const users = await prisma.user.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    });
    const totalUsers = await prisma.user.count();

    // Revenue by month
    const allDoneRequests = await prisma.request.findMany({
      where: { status: "done", clientPrice: { not: null } },
      select: { createdAt: true, clientPrice: true },
    });

    const revenueByMonth: Record<string, number> = {};
    for (const req of allDoneRequests) {
      const month = req.createdAt.toISOString().slice(0, 7); // YYYY-MM
      revenueByMonth[month] = (revenueByMonth[month] || 0) + (req.clientPrice || 0);
    }

    const revenueTimeline = Object.entries(revenueByMonth)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([month, revenue]) => ({ month, revenue: Math.round(revenue) }));

    // Conversion rate
    const totalViews = pageViews.length;
    const totalRequests = requests.length;
    const conversionRate = totalViews > 0 ? ((totalRequests / totalViews) * 100).toFixed(1) : "0";

    return NextResponse.json({
      viewsTimeline,
      topPages,
      requestsTimeline,
      requestsByStatus,
      revenueTimeline,
      totalRevenue: Math.round(totalRevenue),
      totalViews,
      totalRequests,
      totalUsers,
      newUsers: users.length,
      conversionRate,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Ошибка аналитики" }, { status: 500 });
  }
}
