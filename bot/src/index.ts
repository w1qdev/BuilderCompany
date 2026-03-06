import "dotenv/config";
import { Bot, Context } from "@maxhub/max-bot-api";
import { mainMenu } from "./keyboards";
import { prisma } from "./prisma";
import { registerRequestHandlers, handleRequestMessage } from "./handlers/request";
import { registerLinkHandlers, handleLinkMessage } from "./handlers/link";
import { registerRequestsListHandlers } from "./handlers/requests-list";
import { registerInfoHandlers } from "./handlers/info";
import { startCronJobs } from "./cron";

const bot = new Bot(process.env.MAX_BOT_TOKEN!);

// Track bot start time — ignore events older than this
const botStartTime = Date.now();

async function isLinked(maxUserId: number): Promise<boolean> {
  const record = await prisma.maxUser.findUnique({ where: { maxUserId } });
  return !!record;
}

// Track users who got a bot_started event — skip their message_created
const startedUsers = new Set<number>();

// Welcome message
bot.on("bot_started", async (ctx) => {
  const userId = ctx.user?.user_id;
  if (!userId) return;

  // Skip old queued events
  const ts = (ctx.update as any)?.timestamp;
  if (ts && ts < botStartTime) return;

  startedUsers.add(userId);
  setTimeout(() => startedUsers.delete(userId), 5000);

  const linked = await isLinked(userId);
  ctx.reply("👋 Добро пожаловать в ЦСМ «Стандарт»!\n\nВыберите действие:", {
    attachments: [mainMenu(linked)],
  });
});

// Main menu button
bot.action("main_menu", async (ctx) => {
  const linked = ctx.user?.user_id ? await isLinked(ctx.user.user_id) : false;
  ctx.editMessage({ text: "Выберите действие:", attachments: [mainMenu(linked)] });
});

// Register all handlers
registerRequestHandlers(bot);
registerLinkHandlers(bot);
registerRequestsListHandlers(bot);
registerInfoHandlers(bot);

// Text message handler — route through session-based handlers
bot.on("message_created", async (ctx) => {
  const userId = ctx.user?.user_id;

  // Skip if this user just triggered bot_started (avoid duplicate)
  if (userId && startedUsers.has(userId)) return;

  if (handleLinkMessage(ctx)) return;
  if (handleRequestMessage(ctx)) return;

  // Unknown text — show main menu
  const linked = userId ? await isLinked(userId) : false;
  ctx.reply("Выберите действие:", { attachments: [mainMenu(linked)] });
});

// Start bot and cron jobs
bot.start().then(() => {
  console.log("Max bot started");
  startCronJobs();
});

export { isLinked };
