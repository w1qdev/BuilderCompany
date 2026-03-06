import { Keyboard } from "@maxhub/max-bot-api";

export function mainMenu() {
  return Keyboard.inlineKeyboard([
    [Keyboard.button.callback("Подать заявку", "new_request")],
    [Keyboard.button.callback("Мои заявки", "my_requests")],
    [Keyboard.button.callback("Привязать аккаунт", "link_account")],
    [
      Keyboard.button.callback("О компании", "about"),
      Keyboard.button.callback("Контакты", "contacts"),
    ],
  ]);
}

export function servicesMenu() {
  return Keyboard.inlineKeyboard([
    [Keyboard.button.callback("Поверка СИ", "service:Поверка СИ")],
    [Keyboard.button.callback("Калибровка", "service:Калибровка")],
    [Keyboard.button.callback("Сертификация", "service:Сертификация")],
    [Keyboard.button.callback("Аттестация ИЛ", "service:Аттестация")],
    [Keyboard.button.callback("Отмена", "cancel")],
  ]);
}

export function confirmMenu() {
  return Keyboard.inlineKeyboard([
    [
      Keyboard.button.callback("Отправить", "confirm_request", { intent: "positive" }),
      Keyboard.button.callback("Отмена", "cancel", { intent: "negative" }),
    ],
  ]);
}

export function backMenu() {
  return Keyboard.inlineKeyboard([
    [Keyboard.button.callback("Главное меню", "main_menu")],
  ]);
}
