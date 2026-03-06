import { Context } from "@maxhub/max-bot-api";
import { prisma } from "../prisma";
import { servicesMenu, confirmMenu, backMenu } from "../keyboards";
import { getSession, setSession, clearSession } from "../sessions";

export function registerRequestHandlers(bot: any) {
  bot.action("new_request", (ctx: Context) => {
    const userId = ctx.user?.user_id;
    if (!userId) return;
    setSession(userId, { step: "awaiting_service" });
    ctx.editMessage({ text: "🔧 Выберите услугу:", attachments: [servicesMenu()] });
  });

  bot.action(/^service:(.+)$/, (ctx: Context) => {
    const userId = ctx.user?.user_id;
    if (!userId) return;
    const session = getSession(userId);
    if (!session) return;

    const match = (ctx as any).callbackData?.match(/^service:(.+)$/);
    const service = match?.[1] || "";

    setSession(userId, { ...session, step: "awaiting_contact", service });
    ctx.editMessage({
      text: `✅ Услуга: ${service}\n\n📱 Введите ваш телефон и email через пробел.\nПример: +79001234567 mail@example.com`,
    });
  });

  bot.action("confirm_request", async (ctx: Context) => {
    const userId = ctx.user?.user_id;
    if (!userId) return;
    const session = getSession(userId);
    if (!session || session.step !== "awaiting_confirm") return;

    const maxUser = await prisma.maxUser.findUnique({ where: { maxUserId: userId } });

    await prisma.request.create({
      data: {
        name: ctx.user?.name || "Max User",
        phone: session.phone!,
        email: session.email!,
        service: session.service!,
        status: "new",
        userId: maxUser?.userId || null,
        items: {
          create: [{ service: session.service! }],
        },
      },
    });

    clearSession(userId);
    ctx.editMessage({
      text: "🎉 Заявка успешно отправлена!\nМы свяжемся с вами в ближайшее время.",
      attachments: [backMenu()],
    });
  });

  bot.action("cancel", (ctx: Context) => {
    const userId = ctx.user?.user_id;
    if (userId) clearSession(userId);
    ctx.editMessage({ text: "🚫 Действие отменено.", attachments: [backMenu()] });
  });
}

export function handleRequestMessage(ctx: Context): boolean {
  const userId = ctx.user?.user_id;
  if (!userId) return false;
  const session = getSession(userId);
  if (!session || session.step !== "awaiting_contact") return false;

  const text = ctx.message?.body?.text?.trim();
  if (!text) return false;

  const parts = text.split(/\s+/);
  const phone = parts.find((p) => /^\+?\d{10,15}$/.test(p));
  const email = parts.find((p) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p));

  if (!phone || !email) {
    ctx.reply("⚠️ Не удалось распознать телефон или email.\nПример: +79001234567 mail@example.com");
    return true;
  }

  setSession(userId, { ...session, step: "awaiting_confirm", phone, email });
  ctx.reply(
    `📋 Проверьте данные:\n\n🔧 Услуга: ${session.service}\n📱 Телефон: ${phone}\n📧 Email: ${email}`,
    { attachments: [confirmMenu()] }
  );
  return true;
}
