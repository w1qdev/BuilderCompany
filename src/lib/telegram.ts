export async function sendTelegramMessage(text: string, chatId: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || token === "your_bot_token") {
    console.log("Telegram not configured, skipping message");
    return;
  }

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
    }),
  });
}

function escapeTelegram(str: string): string {
  return str.replace(/[*_`\[\]]/g, "\\$&");
}

interface NotificationItem {
  service: string;
  poverk?: string;
  object?: string;
  fabricNumber?: string;
  registry?: string;
}

interface SendTelegramNotification {
  name: string;
  phone: string;
  email: string;
  company?: string;
  inn?: string;
  message?: string;
  items: NotificationItem[];
}

export async function sendTelegramNotification(data: SendTelegramNotification) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId || token === "your_bot_token") {
    console.log("Telegram not configured, skipping notification");
    return;
  }

  const itemsText = data.items.map((item, idx) => {
    const lines = [
      `  *Позиция ${idx + 1}:* ${escapeTelegram(item.service)}`,
      item.poverk ? `  ✅ Поверка: ${escapeTelegram(item.poverk)}` : "",
      item.object ? `  📦 СИ: ${escapeTelegram(item.object)}` : "",
      item.fabricNumber ? `  🔢 Зав. №: ${escapeTelegram(item.fabricNumber)}` : "",
      item.registry ? `  📝 Реестр: ${escapeTelegram(item.registry)}` : "",
    ];
    return lines.filter(Boolean).join("\n");
  }).join("\n\n");

  const text = [
    "📋 *Новая заявка с сайта*",
    "",
    `👤 *Имя:* ${escapeTelegram(data.name)}`,
    data.company ? `🏢 *Организация:* ${escapeTelegram(data.company)}` : "",
    data.inn ? `📄 *ИНН:* ${escapeTelegram(data.inn)}` : "",
    `📞 *Телефон:* ${escapeTelegram(data.phone)}`,
    `📧 *Email:* ${escapeTelegram(data.email)}`,
    "",
    `🔧 *Позиций:* ${data.items.length}`,
    itemsText,
    data.message ? `\n💬 *Сообщение:* ${escapeTelegram(data.message)}` : "",
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
