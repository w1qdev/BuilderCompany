import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminPassword } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const headerPassword = request.headers.get("x-admin-password") || "";
  if (!headerPassword || !(await verifyAdminPassword(headerPassword))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Registration counts for last 6 months
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const registrations = await prisma.user.findMany({
    where: { createdAt: { gte: sixMonthsAgo } },
    select: { createdAt: true },
  });

  const registrationsByMonth: { month: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const count = registrations.filter((r) => {
      const rd = new Date(r.createdAt);
      return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth();
    }).length;
    const label = d.toLocaleDateString("ru-RU", { month: "short", year: "2-digit" });
    registrationsByMonth.push({ month: label, count });
  }

  // Top users by requests + equipment
  const topUsers = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      _count: { select: { requests: true, equipment: true } },
    },
    orderBy: { requests: { _count: "desc" } },
    take: 10,
  });

  // Total counts
  const [totalUsers, bannedUsers] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { banned: true } }),
  ]);

  return NextResponse.json({
    registrationsByMonth,
    topUsers: topUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      requests: u._count.requests,
      equipment: u._count.equipment,
    })),
    totalUsers,
    bannedUsers,
    activeUsers: totalUsers - bannedUsers,
  });
}
