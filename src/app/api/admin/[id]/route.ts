import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendStatusUpdateEmail } from "@/lib/email";
import { getIO } from "@/lib/socket";
import { verifyAdminPassword } from "@/lib/adminAuth";
import { notifyMaxUserStatusChange } from "@/lib/maxUserNotify";

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const headerPassword = req.headers.get("x-admin-password");
  if (!headerPassword || !(await verifyAdminPassword(headerPassword))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { status, adminNotes, executorPrice, markup, assignee } = body;

  // Build update data object with validated fields
  const updateData: {
    status?: string;
    adminNotes?: string | null;
    executorPrice?: number | null;
    markup?: number | null;
    clientPrice?: number | null;
    assignee?: string | null;
  } = {};

  // Validate and add status
  if (status !== undefined) {
    if (!["new", "in_progress", "pending_payment", "review", "done", "cancelled"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    updateData.status = status;
  }

  // Validate and add assignee
  if (assignee !== undefined) {
    updateData.assignee = assignee === "" ? null : assignee;
  }

  // Validate and add adminNotes
  if (adminNotes !== undefined) {
    updateData.adminNotes = adminNotes === "" ? null : adminNotes;
  }

  // Validate and add executorPrice
  if (executorPrice !== undefined) {
    if (executorPrice !== null && (typeof executorPrice !== "number" || !isFinite(executorPrice) || executorPrice < 0)) {
      return NextResponse.json({ error: "Invalid executorPrice" }, { status: 400 });
    }
    updateData.executorPrice = executorPrice;
  }

  // Validate and add markup
  if (markup !== undefined) {
    if (markup !== null && (typeof markup !== "number" || !isFinite(markup) || markup < 0 || markup > 100)) {
      return NextResponse.json({ error: "Invalid markup (must be 0-100)" }, { status: 400 });
    }
    updateData.markup = markup;
  }

  // Ensure at least one field is being updated
  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  // Get current record to access existing values for clientPrice calculation
  const current = await prisma.request.findUnique({
    where: { id: Number(id) },
  });

  if (!current) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  // Auto-calculate clientPrice using new OR existing values
  const finalExecutorPrice = executorPrice !== undefined ? executorPrice : current.executorPrice;
  const finalMarkup = markup !== undefined ? markup : current.markup;

  if (finalExecutorPrice !== null && finalMarkup !== null) {
    updateData.clientPrice = finalExecutorPrice * (1 + finalMarkup / 100);
  } else {
    updateData.clientPrice = null;
  }

  const updated = await prisma.request.update({
    where: { id: Number(id) },
    data: updateData,
    include: { user: true },
  });

  // Emit realtime events
  const io = getIO();
  if (io) {
    io.emit("request-update", updated);
    if (updateData.status && updated.userId) {
      io.to(`user:${updated.userId}`).emit("request-status-changed", {
        requestId: updated.id,
        status: updateData.status,
        service: updated.service,
      });
    }
  }

  // Send email to user when status changes
  if (updateData.status && updateData.status !== current.status) {
    const emailRecipient = (updated as typeof updated & { user?: { email: string; name: string } | null }).user
      ? (updated as typeof updated & { user: { email: string; name: string } }).user
      : { email: updated.email, name: updated.name };

    sendStatusUpdateEmail({
      name: emailRecipient.name,
      email: emailRecipient.email,
      requestId: updated.id,
      status: updateData.status,
      adminNotes: updated.adminNotes,
    }).catch(console.error);

    // Notify via Max messenger
    if (updated.userId) {
      notifyMaxUserStatusChange({
        userId: updated.userId,
        requestId: updated.id,
        status: updateData.status,
        service: updated.service,
      }).catch(console.error);
    }
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const headerPassword = req.headers.get("x-admin-password");
  if (!headerPassword || !(await verifyAdminPassword(headerPassword))) {
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
