import { prisma } from "@/lib/prisma";

const MAX_API_BASE = "https://platform-api.max.ru";

const STATUS_LABELS: Record<string, string> = {
  new: "Новая",
  in_progress: "В работе",
  pending_payment: "Ожидает оплаты",
  review: "На проверке",
  done: "Выполнена",
  cancelled: "Отменена",
};

export async function notifyMaxUserStatusChange(params: {
  userId: number;
  requestId: number;
  status: string;
  service: string;
}) {
  const token = process.env.MAX_BOT_TOKEN;
  if (!token) return;

  const maxUser = await prisma.maxUser.findFirst({
    where: { userId: params.userId },
  });
  if (!maxUser) return;

  const statusLabel = STATUS_LABELS[params.status] || params.status;
  const text = `Заявка #${params.requestId} (${params.service})\n\nСтатус изменён: **${statusLabel}**`;

  try {
    await fetch(`${MAX_API_BASE}/messages?user_id=${maxUser.maxUserId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({ text, format: "markdown", notify: true }),
    });
  } catch (error) {
    console.error("Max user notification error:", error);
  }
}
