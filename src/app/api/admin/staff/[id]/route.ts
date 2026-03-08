import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminPassword } from "@/lib/adminAuth";
import { createRateLimiter } from "@/lib/rateLimit";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

const writeLimiter = createRateLimiter({ max: 20, windowMs: 60 * 1000 });

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!writeLimiter(req)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const headerPassword = req.headers.get("x-admin-password");
  if (!headerPassword || !(await verifyAdminPassword(headerPassword))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { name, login, password, role, active } = body;

  const updateData: {
    name?: string;
    login?: string;
    password?: string;
    role?: string;
    active?: boolean;
  } = {};

  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Name cannot be empty" },
        { status: 400 }
      );
    }
    updateData.name = name.trim();
  }

  if (login !== undefined) {
    if (typeof login !== "string" || login.trim().length < 3) {
      return NextResponse.json(
        { error: "Login must be at least 3 characters" },
        { status: 400 }
      );
    }
    updateData.login = login.trim().toLowerCase();
  }

  if (password !== undefined) {
    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }
    updateData.password = await bcrypt.hash(password, 12);
  }

  if (role !== undefined) {
    updateData.role = role;
  }

  if (active !== undefined) {
    if (typeof active !== "boolean") {
      return NextResponse.json(
        { error: "Active must be a boolean" },
        { status: 400 }
      );
    }
    updateData.active = active;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  try {
    const staff = await prisma.staff.update({
      where: { id: Number(id) },
      data: updateData,
      select: {
        id: true,
        name: true,
        login: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ staff });
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
    if (
      err instanceof Error &&
      err.message.includes("Record to update not found")
    ) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }
    throw err;
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!writeLimiter(req)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const headerPassword = req.headers.get("x-admin-password");
  if (!headerPassword || !(await verifyAdminPassword(headerPassword))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const staffId = Number(id);

  // Verify staff exists
  const existing = await prisma.staff.findUnique({
    where: { id: staffId },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Staff member not found" },
      { status: 404 }
    );
  }

  // Unassign all requests from this staff member, then delete
  await prisma.$transaction([
    prisma.request.updateMany({
      where: { assigneeId: staffId },
      data: { assigneeId: null },
    }),
    prisma.staff.delete({
      where: { id: staffId },
    }),
  ]);

  return NextResponse.json({ success: true });
}
