import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getIO } from "@/lib/socket";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const password = req.headers.get("x-admin-password");
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { status } = body;

  if (!status || !["new", "in_progress", "done"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updated = await prisma.request.update({
    where: { id: Number(id) },
    data: { status },
  });

  // Emit realtime event to admin panel
  const io = getIO();
  if (io) {
    io.emit("status-update", updated);
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const password = req.headers.get("x-admin-password");
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await prisma.request.delete({
    where: { id: Number(id) },
  });

  const io = getIO();
  if (io) {
    io.emit("delete-request", { id: Number(id) });
  }

  return NextResponse.json({ success: true });
}
