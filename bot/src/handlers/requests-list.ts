import { Context } from "@maxhub/max-bot-api";
import { prisma } from "../prisma";
import { backMenu } from "../keyboards";

const STATUS_LABELS: Record<string, string> = {
  new: "🆕 Новая",
  in_progress: "🔄 В работе",
  pending_payment: "💳 Ожидает оплаты",
  review: "🔎 На проверке",
  done: "✅ Выполнена",
  cancelled: "❌ Отменена",
};

export function registerRequestsListHandlers(bot: any) {
  bot.action("my_requests", async (ctx: Context) => {
    const maxUserId = ctx.user?.user_id;
    if (!maxUserId) return;

    const maxUser = await prisma.maxUser.findUnique({ where: { maxUserId } });
    if (!maxUser) {
      ctx.editMessage({
        text: "⚠️ Сначала привяжите аккаунт, чтобы видеть свои заявки.",
        attachments: [backMenu()],
      });
      return;
    }

    const requests = await prisma.request.findMany({
      where: { userId: maxUser.userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    if (requests.length === 0) {
      ctx.editMessage({ text: "📭 У вас пока нет заявок.", attachments: [backMenu()] });
      return;
    }

    const lines = requests.map((r) => {
      const date = r.createdAt.toLocaleDateString("ru-RU");
      const status = STATUS_LABELS[r.status] || r.status;
      return `#${r.id} | ${r.service} | ${status} | ${date}`;
    });

    ctx.editMessage({
      text: `📋 Ваши последние заявки:\n\n${lines.join("\n")}`,
      attachments: [backMenu()],
    });
  });
}
