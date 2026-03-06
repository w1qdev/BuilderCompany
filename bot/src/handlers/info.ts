import { Context } from "@maxhub/max-bot-api";
import { prisma } from "../prisma";
import { backMenu } from "../keyboards";

export function registerInfoHandlers(bot: any) {
  bot.action("about", (ctx: Context) => {
    ctx.reply(
      "**ЦСМ «Стандарт»**\n\n" +
      "Центр сертификации и метрологии.\n" +
      "Оказываем услуги поверки, калибровки, сертификации и аттестации.\n\n" +
      "Сайт: csm-center.ru",
      { attachments: [backMenu()], format: "markdown" }
    );
  });

  bot.action("contacts", async (ctx: Context) => {
    const settings = await prisma.setting.findMany({
      where: { key: { in: ["companyPhone", "companyEmail", "companyAddress"] } },
    });
    const get = (key: string) => settings.find((s) => s.key === key)?.value || "";

    const phone = get("companyPhone") || "+7 (XXX) XXX-XX-XX";
    const email = get("companyEmail") || "zakaz@csm-center.ru";
    const address = get("companyAddress") || "";

    const lines = [
      "**Контакты**",
      "",
      `Телефон: ${phone}`,
      `Email: ${email}`,
      address ? `Адрес: ${address}` : "",
      "",
      "Сайт: csm-center.ru",
    ];

    ctx.reply(lines.filter(Boolean).join("\n"), {
      attachments: [backMenu()],
      format: "markdown",
    });
  });
}
