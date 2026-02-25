import { prisma } from "@/lib/prisma";

export async function logActivity(params: {
  userId: number;
  action: string;
  entityType: string;
  entityId?: number;
  details?: string;
}) {
  try {
    await prisma.activityLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId ?? null,
        details: params.details ?? null,
      },
    });
  } catch (e) {
    console.error("Failed to log activity:", e);
  }
}
