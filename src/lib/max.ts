const MAX_API_BASE = "https://platform-api.max.ru";

interface NotificationItem {
  service: string;
  poverk?: string;
  object?: string;
  fabricNumber?: string;
  registry?: string;
}

interface SendMaxNotification {
  name: string;
  phone: string;
  email: string;
  company?: string;
  message?: string;
  items: NotificationItem[];
}

export async function sendMaxNotification(data: SendMaxNotification) {
  const token = process.env.MAX_BOT_TOKEN;
  const chatId = process.env.MAX_CHAT_ID;

  if (!token || !chatId) {
    console.log("MAX messenger not configured, skipping notification");
    return;
  }

  const itemsText = data.items
    .map((item, idx) => {
      const lines = [
        `  **Позиция ${idx + 1}:** ${item.service}`,
        item.poverk ? `  Поверка: ${item.poverk}` : "",
        item.object ? `  СИ: ${item.object}` : "",
        item.fabricNumber ? `  Зав. №: ${item.fabricNumber}` : "",
        item.registry ? `  Реестр: ${item.registry}` : "",
      ];
      return lines.filter(Boolean).join("\n");
    })
    .join("\n\n");

  const text = [
    "**Новая заявка с сайта**",
    "",
    `**Имя:** ${data.name}`,
    `**Телефон:** ${data.phone}`,
    `**Email:** ${data.email}`,
    data.company ? `**Организация:** ${data.company}` : "",
    "",
    `**Позиций:** ${data.items.length}`,
    itemsText,
    data.message ? `\n**Сообщение:** ${data.message}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const res = await fetch(`${MAX_API_BASE}/messages?chat_id=${chatId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({
        text,
        format: "markdown",
        notify: true,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("MAX notification error:", res.status, err);
    }
  } catch (error) {
    console.error("MAX notification error:", error);
  }
}
