import { Keyboard } from "@maxhub/max-bot-api";

export function mainMenu(linked = false) {
  const rows = [
    [Keyboard.button.callback("📝 Подать заявку", "new_request")],
    [Keyboard.button.callback("📋 Мои заявки", "my_requests")],
  ];

  if (!linked) {
    rows.push([
      Keyboard.button.callback("🔗 Привязать аккаунт", "link_account"),
    ]);
  }

  rows.push([
    Keyboard.button.callback("🏢 О компании", "about"),
    Keyboard.button.callback("📞 Контакты", "contacts"),
  ]);

  return Keyboard.inlineKeyboard(rows);
}

export function servicesMenu() {
  return Keyboard.inlineKeyboard([
    [Keyboard.button.callback("🔍 Поверка СИ", "service:Поверка СИ")],
    [Keyboard.button.callback("⚙️ Калибровка", "service:Калибровка")],
    [Keyboard.button.callback("🧪 Аттестация ИО", "service:Аттестация")],
    [Keyboard.button.callback("❌ Отмена", "cancel")],
  ]);
}

export function confirmMenu() {
  return Keyboard.inlineKeyboard([
    [
      Keyboard.button.callback("✅ Отправить", "confirm_request", {
        intent: "positive",
      }),
      Keyboard.button.callback("❌ Отмена", "cancel", { intent: "negative" }),
    ],
  ]);
}

export function backMenu() {
  return Keyboard.inlineKeyboard([
    [Keyboard.button.callback("🏠 Главное меню", "main_menu")],
  ]);
}
