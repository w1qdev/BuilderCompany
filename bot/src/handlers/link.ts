import { Context } from "@maxhub/max-bot-api";
import { prisma } from "../prisma";
import { backMenu } from "../keyboards";
import { setAwaitingLink, isAwaitingLink, clearAwaitingLink } from "../sessions";

export function registerLinkHandlers(bot: any) {
  bot.action("link_account", async (ctx: Context) => {
    const maxUserId = ctx.user?.user_id;
    if (!maxUserId) return;

    const existing = await prisma.maxUser.findUnique({ where: { maxUserId } });
    if (existing) {
      ctx.editMessage({ text: "✅ Ваш аккаунт уже привязан.", attachments: [backMenu()] });
      return;
    }

    setAwaitingLink(maxUserId);
    ctx.editMessage({
      text: "🔗 Введите 6-значный код из личного кабинета на сайте\n(Профиль → Уведомления → Привязать Max):",
    });
  });
}

export function handleLinkMessage(ctx: Context): boolean {
  const maxUserId = ctx.user?.user_id;
  if (!maxUserId || !isAwaitingLink(maxUserId)) return false;

  const text = ctx.message?.body?.text?.trim();
  if (!text || !/^\d{6}$/.test(text)) {
    ctx.reply("⚠️ Введите 6-значный числовой код:");
    return true;
  }

  (async () => {
    const linkCode = await prisma.maxLinkCode.findFirst({
      where: { code: text, used: false, expiresAt: { gte: new Date() } },
    });

    if (!linkCode) {
      ctx.reply("❌ Код неверный или истёк. Получите новый код на сайте.", {
        attachments: [backMenu()],
      });
      clearAwaitingLink(maxUserId);
      return;
    }

    await prisma.maxLinkCode.update({ where: { id: linkCode.id }, data: { used: true } });
    await prisma.maxUser.create({ data: { maxUserId, userId: linkCode.userId } });

    clearAwaitingLink(maxUserId);
    ctx.reply("🎉 Аккаунт успешно привязан! Теперь вы будете получать уведомления.", {
      attachments: [backMenu()],
    });
  })();

  return true;
}
