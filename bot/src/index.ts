import "dotenv/config";
import { Bot, Context } from "@maxhub/max-bot-api";
import { mainMenu } from "./keyboards";
import { registerRequestHandlers, handleRequestMessage } from "./handlers/request";
import { registerLinkHandlers, handleLinkMessage } from "./handlers/link";
import { registerRequestsListHandlers } from "./handlers/requests-list";
import { registerInfoHandlers } from "./handlers/info";
import { startCronJobs } from "./cron";

const bot = new Bot(process.env.MAX_BOT_TOKEN!);

// Welcome message
bot.on("bot_started", (ctx) => {
  ctx.reply("Добро пожаловать в ЦСМ «Стандарт»!\n\nВыберите действие:", {
    attachments: [mainMenu()],
  });
});

// Main menu button
bot.action("main_menu", (ctx) => {
  ctx.reply("Выберите действие:", { attachments: [mainMenu()] });
});

// Register all handlers
registerRequestHandlers(bot);
registerLinkHandlers(bot);
registerRequestsListHandlers(bot);
registerInfoHandlers(bot);

// Text message handler — route through session-based handlers
bot.on("message_created", (ctx) => {
  if (handleLinkMessage(ctx)) return;
  if (handleRequestMessage(ctx)) return;
  // Unknown text — show main menu
  ctx.reply("Выберите действие:", { attachments: [mainMenu()] });
});

// Start bot and cron jobs
bot.start().then(() => {
  console.log("Max bot started");
  startCronJobs();
});
