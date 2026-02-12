"use client";

import Logo from "@/components/Logo";
import { useSiteSettings } from "@/lib/SiteSettingsContext";
import Link from "next/link";

export default function PrivacyPage() {
  const { phone, email, address } = useSiteSettings();
  const telHref = `tel:+7${phone.replace(/\D/g, "").slice(1)}`;

  return (
    <div className="min-h-screen bg-warm-bg dark:bg-dark">
      {/* Header */}
      <div className="gradient-dark text-white">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <Logo size="sm" />
          </Link>
          <span className="text-white/40 text-sm">
            / Политика конфиденциальности
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white dark:bg-dark-light rounded-2xl shadow-lg p-8 sm:p-12">
          <h1 className="text-3xl font-extrabold text-dark dark:text-white mb-8">
            Политика конфиденциальности
          </h1>

          <div className="space-y-6 text-neutral dark:text-white/60 text-sm leading-relaxed">
            <section>
              <h2 className="text-lg font-bold text-dark dark:text-white mb-3">
                1. Общие положения
              </h2>
              <p>
                Настоящая Политика конфиденциальности (далее — «Политика»)
                определяет порядок обработки и защиты персональных данных
                пользователей сайта «ЦСМ — Центр Стандартизации и Метрологии»
                (далее — «Оператор»), расположенного по адресу csm-center.ru.
              </p>
              <p className="mt-2">
                Политика разработана в соответствии с Федеральным законом от
                27.07.2006 № 152-ФЗ «О персональных данных». Используя сайт и
                предоставляя свои персональные данные, вы подтверждаете согласие
                с условиями данной Политики.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-dark dark:text-white mb-3">
                2. Какие данные мы собираем
              </h2>
              <p>При использовании сайта мы можем собирать следующие данные:</p>
              <h3 className="font-semibold text-dark dark:text-white mt-3 mb-1">
                2.1. При отправке заявки через форму обратной связи:
              </h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Фамилия, имя, отчество</li>
                <li>Номер телефона</li>
                <li>Адрес электронной почты</li>
                <li>Наименование организации</li>
                <li>Выбранная услуга и текст сообщения</li>
                <li>Прикреплённые файлы (PDF, Word, изображения — до 10 МБ)</li>
              </ul>
              <h3 className="font-semibold text-dark dark:text-white mt-3 mb-1">
                2.2. При регистрации личного кабинета:
              </h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Имя</li>
                <li>Адрес электронной почты</li>
                <li>Пароль (хранится в зашифрованном виде)</li>
                <li>Телефон и название компании (опционально)</li>
              </ul>
              <h3 className="font-semibold text-dark dark:text-white mt-3 mb-1">
                2.3. Автоматически при посещении сайта:
              </h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Технические данные браузера (User-Agent)</li>
                <li>IP-адрес</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-dark dark:text-white mb-3">
                3. Цели обработки данных
              </h2>
              <p>Персональные данные обрабатываются в следующих целях:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Приём и обработка заявок на метрологические услуги (поверка, калибровка, аттестация)</li>
                <li>Связь с пользователем для уточнения деталей заявки и консультации</li>
                <li>Обеспечение работы личного кабинета и авторизации</li>
                <li>Формирование отчётных документов (экспорт заявок)</li>
                <li>Отправка уведомлений о статусе заявки на электронную почту</li>
                <li>Улучшение качества обслуживания и работы сайта</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-dark dark:text-white mb-3">
                4. Использование файлов cookie
              </h2>
              <p>
                Сайт использует файлы cookie для обеспечения работы авторизации
                (httpOnly cookie с токеном аутентификации). Эти cookie являются
                строго необходимыми для функционирования личного кабинета и не
                используются в рекламных или аналитических целях.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-dark dark:text-white mb-3">
                5. Защита данных
              </h2>
              <p>
                Оператор принимает организационные и технические меры для защиты
                персональных данных, в том числе:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Хранение паролей в зашифрованном виде (bcrypt)</li>
                <li>Использование защищённых токенов авторизации (JWT)</li>
                <li>Ограничение доступа к административной панели</li>
                <li>Защита от перебора паролей (rate limiting)</li>
                <li>Ограничение типов и размера загружаемых файлов</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-dark dark:text-white mb-3">
                6. Передача данных третьим лицам
              </h2>
              <p>
                Оператор не передаёт и не продаёт персональные данные третьим
                лицам, за исключением случаев, предусмотренных законодательством
                Российской Федерации.
              </p>
              <p className="mt-2">
                Для отправки уведомлений могут использоваться сторонние сервисы
                (SMTP-сервер для электронной почты, Telegram Bot API), при этом
                передаётся только информация, необходимая для доставки
                уведомления.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-dark dark:text-white mb-3">
                7. Хранение данных
              </h2>
              <p>
                Персональные данные хранятся в базе данных на сервере Оператора
                и не передаются за пределы Российской Федерации. Данные хранятся
                в течение срока, необходимого для выполнения целей обработки. По
                достижении целей обработки или по запросу пользователя данные
                удаляются.
              </p>
              <p className="mt-2">
                Загруженные пользователем файлы хранятся на сервере и доступны
                только авторизованным сотрудникам через административную панель.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-dark dark:text-white mb-3">
                8. Права пользователя
              </h2>
              <p>
                В соответствии с Федеральным законом № 152-ФЗ пользователь имеет
                право:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Получить информацию об обработке своих персональных данных</li>
                <li>Потребовать уточнения, блокирования или удаления персональных данных</li>
                <li>Отозвать согласие на обработку персональных данных</li>
                <li>Обратиться в уполномоченный орган по защите прав субъектов персональных данных (Роскомнадзор)</li>
              </ul>
              <p className="mt-2">
                Для реализации указанных прав направьте запрос на электронную
                почту Оператора.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-dark dark:text-white mb-3">
                9. Контактная информация
              </h2>
              <p>
                По вопросам, связанным с обработкой персональных данных, вы
                можете обратиться:
              </p>
              <ul className="list-none mt-2 space-y-1">
                <li>
                  Email:{" "}
                  <a
                    href={`mailto:${email}`}
                    className="text-primary hover:underline"
                  >
                    {email}
                  </a>
                </li>
                <li>
                  Телефон:{" "}
                  <a href={telHref} className="text-primary hover:underline">
                    {phone}
                  </a>
                </li>
                <li>Адрес: {address}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-dark dark:text-white mb-3">
                10. Изменения в Политике
              </h2>
              <p>
                Оператор оставляет за собой право вносить изменения в настоящую
                Политику конфиденциальности. Актуальная версия Политики всегда
                доступна на данной странице. Дата последнего обновления: февраль
                2026 г.
              </p>
            </section>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-100 dark:border-white/10">
            <Link
              href="/"
              className="text-primary hover:underline text-sm font-medium"
            >
              ← Вернуться на главную
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
