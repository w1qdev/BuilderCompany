import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const in30Days = new Date(now);
  in30Days.setDate(in30Days.getDate() + 30);

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(todayStart);
  weekAgo.setDate(weekAgo.getDate() - 7);

  try {
    const [
      totalEquipment,
      activeCount,
      pendingCount,
      expiredCount,
      overdueItems,
      upcomingItems,
      pinnedItems,
      newRequests,
      inProgressRequests,
      doneRequests,
      recentRequests,
      activities,
      weeklyEquipmentAdded,
      weeklyRequestsCreated,
      weeklyVerified,
    ] = await Promise.all([
      // totalEquipment
      prisma.equipment.count({
        where: { userId, ignored: false },
      }),
      // activeCount
      prisma.equipment.count({
        where: { userId, ignored: false, status: "active" },
      }),
      // pendingCount
      prisma.equipment.count({
        where: { userId, ignored: false, status: "pending" },
      }),
      // expiredCount
      prisma.equipment.count({
        where: { userId, ignored: false, status: "expired" },
      }),
      // overdueItems
      prisma.equipment.count({
        where: {
          userId,
          ignored: false,
          nextVerification: { lt: todayStart },
        },
      }),
      // upcomingItems — next 30 days
      prisma.equipment.findMany({
        where: {
          userId,
          ignored: false,
          nextVerification: {
            gte: todayStart,
            lte: in30Days,
          },
        },
        select: {
          id: true,
          name: true,
          type: true,
          nextVerification: true,
          status: true,
          category: true,
          pinned: true,
        },
        orderBy: { nextVerification: "asc" },
        take: 5,
      }),
      // pinnedItems
      prisma.equipment.findMany({
        where: { userId, pinned: true },
        select: {
          id: true,
          name: true,
          type: true,
          nextVerification: true,
          status: true,
          category: true,
          pinned: true,
        },
        orderBy: { nextVerification: "asc" },
        take: 10,
      }),
      // request counts — new
      prisma.request.count({
        where: { userId, status: "new" },
      }),
      // request counts — in_progress
      prisma.request.count({
        where: { userId, status: "in_progress" },
      }),
      // request counts — done
      prisma.request.count({
        where: { userId, status: "done" },
      }),
      // recentRequests
      prisma.request.findMany({
        where: { userId },
        select: {
          id: true,
          service: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      // activities
      prisma.activityLog.findMany({
        where: { userId },
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          details: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      // weeklyEquipmentAdded
      prisma.equipment.count({
        where: { userId, createdAt: { gte: weekAgo } },
      }),
      // weeklyRequestsCreated
      prisma.request.count({
        where: { userId, createdAt: { gte: weekAgo } },
      }),
      // weeklyVerified — equipment verified (verificationDate updated) this week
      prisma.equipment.count({
        where: { userId, verificationDate: { gte: weekAgo } },
      }),
    ]);

    return NextResponse.json({
      totalEquipment,
      activeCount,
      pendingCount,
      expiredCount,
      overdueItems,
      upcomingItems,
      pinnedItems,
      requestCounts: {
        new: newRequests,
        in_progress: inProgressRequests,
        done: doneRequests,
        total: newRequests + inProgressRequests + doneRequests,
      },
      recentRequests,
      activities,
      weeklySummary: {
        equipmentAdded: weeklyEquipmentAdded,
        requestsCreated: weeklyRequestsCreated,
        verified: weeklyVerified,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard stats" },
      { status: 500 }
    );
  }
}
