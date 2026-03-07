import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { createRateLimiter } from "@/lib/rateLimit";
import { bulkActionSchema, validate } from "@/lib/validation";

const bulkLimiter = createRateLimiter({ max: 10, windowMs: 60 * 1000 });

export const dynamic = "force-dynamic";

const MAX_BATCH_SIZE = 100;
type BulkAction = "delete" | "archive" | "unarchive";

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    if (!bulkLimiter(request, userId)) {
      return NextResponse.json(
        { error: "Слишком много запросов" },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = validate(bulkActionSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const { action, ids } = parsed.data;

    if (ids.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        { error: `Максимальный размер пакета: ${MAX_BATCH_SIZE}` },
        { status: 400 }
      );
    }

    const numericIds = ids
      .map(Number)
      .filter((id) => Number.isFinite(id) && id > 0);
    if (numericIds.length !== ids.length) {
      return NextResponse.json(
        { error: "Все идентификаторы должны быть положительными числами" },
        { status: 400 }
      );
    }

    // Verify all IDs are accessible (owned or org member)
    const { canAccessOrgEquipment } = await import("@/lib/orgAccess");
    for (const eqId of numericIds) {
      if (!(await canAccessOrgEquipment(userId, eqId))) {
        return NextResponse.json(
          { error: "Некоторые записи не найдены или не принадлежат вам" },
          { status: 403 }
        );
      }
    }

    // Get orgIds before mutation (for realtime)
    const affectedOrgs = await prisma.equipment.findMany({
      where: { id: { in: numericIds } },
      select: { organizationId: true },
      distinct: ["organizationId"],
    });

    let count = 0;

    switch (action as BulkAction) {
      case "delete": {
        const result = await prisma.equipment.deleteMany({
          where: { id: { in: numericIds } },
        });
        count = result.count;
        break;
      }
      case "archive": {
        const result = await prisma.equipment.updateMany({
          where: { id: { in: numericIds } },
          data: { ignored: true },
        });
        count = result.count;
        break;
      }
      case "unarchive": {
        const result = await prisma.equipment.updateMany({
          where: { id: { in: numericIds } },
          data: { ignored: false },
        });
        count = result.count;
        break;
      }
    }

    const { getIO } = await import("@/lib/socket");
    const io = getIO();
    if (io) {
      for (const eq of affectedOrgs) {
        if (eq.organizationId) {
          io.to(`org:${eq.organizationId}`).emit("equipment-changed", {
            action,
            ids: numericIds,
          });
        }
      }
    }

    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error("Bulk equipment operation error:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
