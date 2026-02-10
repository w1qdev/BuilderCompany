function escapeTelegram(str: string): string {
  return str.replace(/[*_`\[\]]/g, "\\$&");
}

interface SendTelegramNotification {
  name: string;
  phone: string;
  email: string;
  service: string;
  message?: string;
}

export async function sendTelegramNotification(data: SendTelegramNotification) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId || token === "your_bot_token") {
    console.log("Telegram not configured, skipping notification");
    return;
  }

  const text = [
    "📋 *Новая заявка с сайта*",
    "",
    `👤 *Имя:* ${escapeTelegram(data.name)}`,
    `📞 *Телефон:* ${escapeTelegram(data.phone)}`,
    `📧 *Email:* ${escapeTelegram(data.email)}`,
    `🔧 *Услуга:* ${escapeTelegram(data.service)}`,
    data.message ? `💬 *Сообщение:* ${escapeTelegram(data.message)}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
      }),
    });
  } catch (error) {
    console.error("Telegram notification error:", error);
  }
}
