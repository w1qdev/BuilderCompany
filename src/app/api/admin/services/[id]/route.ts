import { verifyAdminPassword } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// PATCH update service (admin)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const password = req.headers.get("x-admin-password");
    if (!password) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const isValid = await verifyAdminPassword(password);

    if (!isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);
    const body = await req.json();
    const { title, description, price, image, category, isActive } = body;

    const service = await prisma.service.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: parseInt(price) }),
        ...(image !== undefined && { image }),
        ...(category !== undefined && { category }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(service);
  } catch (error) {
    console.error("Service update error:", error);
    return NextResponse.json(
      { error: "Ошибка обновления услуги" },
      { status: 500 }
    );
  }
}

// DELETE service (admin)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const password = req.headers.get("x-admin-password");
    if (!password) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const isValid = await verifyAdminPassword(password);

    if (!isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);

    await prisma.service.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Service deletion error:", error);
    return NextResponse.json(
      { error: "Ошибка удаления услуги" },
      { status: 500 }
    );
  }
}
