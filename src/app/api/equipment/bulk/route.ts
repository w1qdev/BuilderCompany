import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { createRateLimiter } from "@/lib/rateLimit";
import { bulkActionSchema, validate } from "@/lib/validation";

const bulkLimiter = createRateLimiter({ max: 10, windowMs: 60 * 1000 });

export const dynamic = "force-dynamic";

const MAX_BATCH_SIZE = 100;
const VALID_ACTIONS = ["delete", "archive", "unarchive"] as const;
type BulkAction = (typeof VALID_ACTIONS)[number];

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    if (!bulkLimiter(request, userId)) {
      return NextResponse.json({ error: "Слишком много запросов" }, { status: 429 });
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

    const numericIds = ids.map(Number).filter((id) => Number.isFinite(id) && id > 0);
    if (numericIds.length !== ids.length) {
      return NextResponse.json(
        { error: "Все идентификаторы должны быть положительными числами" },
        { status: 400 }
      );
    }

    // Verify all IDs belong to the authenticated user
    const ownedCount = await prisma.equipment.count({
      where: { id: { in: numericIds }, userId },
    });

    if (ownedCount !== numericIds.length) {
      return NextResponse.json(
        { error: "Некоторые записи не найдены или не принадлежат вам" },
        { status: 403 }
      );
    }

    let count = 0;

    switch (action as BulkAction) {
      case "delete": {
        const result = await prisma.equipment.deleteMany({
          where: { id: { in: numericIds }, userId },
        });
        count = result.count;
        break;
      }
      case "archive": {
        const result = await prisma.equipment.updateMany({
          where: { id: { in: numericIds }, userId },
          data: { ignored: true },
        });
        count = result.count;
        break;
      }
      case "unarchive": {
        const result = await prisma.equipment.updateMany({
          where: { id: { in: numericIds }, userId },
          data: { ignored: false },
        });
        count = result.count;
        break;
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
