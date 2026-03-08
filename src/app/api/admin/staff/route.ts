import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminPassword } from "@/lib/adminAuth";
import { createRateLimiter } from "@/lib/rateLimit";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

const readLimiter = createRateLimiter({ max: 60, windowMs: 60 * 1000 });
const writeLimiter = createRateLimiter({ max: 20, windowMs: 60 * 1000 });

export async function GET(req: NextRequest) {
  if (!readLimiter(req)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const headerPassword = req.headers.get("x-admin-password");
  if (!headerPassword || !(await verifyAdminPassword(headerPassword))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const staff = await prisma.staff.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      login: true,
      role: true,
      active: true,
      createdAt: true,
      _count: { select: { requests: true } },
    },
  });

  return NextResponse.json({ staff });
}

export async function POST(req: NextRequest) {
  if (!writeLimiter(req)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const headerPassword = req.headers.get("x-admin-password");
  if (!headerPassword || !(await verifyAdminPassword(headerPassword))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, login, password, role } = body;

  // Validate required fields
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (!login || typeof login !== "string" || login.trim().length < 3) {
    return NextResponse.json(
      { error: "Login is required (min 3 characters)" },
      { status: 400 }
    );
  }
  if (!password || typeof password !== "string" || password.length < 8) {
    return NextResponse.json(
      { error: "Password is required (min 8 characters)" },
      { status: 400 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  try {
    const staff = await prisma.staff.create({
      data: {
        name: name.trim(),
        login: login.trim().toLowerCase(),
        password: hashedPassword,
        role: role || "staff",
      },
      select: {
        id: true,
        name: true,
        login: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ staff }, { status: 201 });
  } catch (err) {
    if (
      err instanceof Error &&
      err.message.includes("Unique constraint failed")
    ) {
      return NextResponse.json(
        { error: "A staff member with this login already exists" },
        { status: 409 }
      );
    }
    throw err;
  }
}
