import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { addMemberSchema, validate } from "@/lib/validation";

export const dynamic = "force-dynamic";

async function isOrgAdmin(userId: number, orgId: number): Promise<boolean> {
  const membership = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId: orgId } },
  });
  return membership?.role === "admin";
}

// POST /api/organizations/members — add member by email
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = validate(addMemberSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const { organizationId, email, role } = parsed.data;

    if (!(await isOrgAdmin(userId, organizationId))) {
      return NextResponse.json({ error: "Только администратор может добавлять участников" }, { status: 403 });
    }

    const targetUser = await prisma.user.findUnique({ where: { email } });
    if (!targetUser) {
      return NextResponse.json({ error: "Пользователь с таким email не найден" }, { status: 404 });
    }

    const existing = await prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId: targetUser.id, organizationId } },
    });
    if (existing) {
      return NextResponse.json({ error: "Пользователь уже в организации" }, { status: 400 });
    }

    const member = await prisma.organizationMember.create({
      data: {
        userId: targetUser.id,
        organizationId,
        role: role === "admin" ? "admin" : "member",
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    const { getIO } = await import("@/lib/socket");
    const io = getIO();
    if (io) {
      io.to(`org:${organizationId}`).emit("org-member-changed", { action: "added", userId: targetUser.id, organizationId });
    }

    return NextResponse.json({ member });
  } catch (error) {
    console.error("Add member error:", error);
    return NextResponse.json({ error: "Ошибка" }, { status: 500 });
  }
}

// DELETE /api/organizations/members — remove member
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orgId = Number(searchParams.get("organizationId"));
    const memberId = Number(searchParams.get("userId"));

    if (!orgId || !memberId) {
      return NextResponse.json({ error: "Укажите организацию и пользователя" }, { status: 400 });
    }

    // Can remove yourself or be admin
    if (memberId !== userId && !(await isOrgAdmin(userId, orgId))) {
      return NextResponse.json({ error: "Нет прав" }, { status: 403 });
    }

    await prisma.organizationMember.deleteMany({
      where: { userId: memberId, organizationId: orgId },
    });

    const { getIO } = await import("@/lib/socket");
    const io = getIO();
    if (io) {
      io.to(`org:${orgId}`).emit("org-member-changed", { action: "removed", userId: memberId, organizationId: orgId });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove member error:", error);
    return NextResponse.json({ error: "Ошибка" }, { status: 500 });
  }
}
