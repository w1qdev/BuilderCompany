import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const password = req.headers.get("x-admin-password");
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [total, newCount, inProgressCount, doneCount] = await Promise.all([
    prisma.request.count(),
    prisma.request.count({ where: { status: "new" } }),
    prisma.request.count({ where: { status: "in_progress" } }),
    prisma.request.count({ where: { status: "done" } }),
  ]);

  return NextResponse.json({
    total,
    new: newCount,
    in_progress: inProgressCount,
    done: doneCount,
  });
}
