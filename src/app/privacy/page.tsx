"use client";

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
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <span className="font-bold">ЦСМ</span>
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
                пользователей сайта ЦСМ (далее — «Оператор»). Используя сайт и
                предоставляя свои персональные данные, вы соглашаетесь с
                условиями данной Политики.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-dark dark:text-white mb-3">
                2. Какие данные мы собираем
              </h2>
              <p>Мы можем собирать следующие персональные данные:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Имя и фамилия</li>
                <li>Номер телефона</li>
                <li>Адрес электронной почты</li>
                <li>Информация о запрашиваемых услугах</li>
                <li>Текст сообщений, оставленных через форму обратной связи</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-dark dark:text-white mb-3">
                3. Цели обработки данных
              </h2>
              <p>Персональные данные обрабатываются в следующих целях:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Обработка входящих заявок и обращений</li>
                <li>Связь с пользователем для консультации</li>
                <li>Улучшение качества обслуживания</li>
                <li>Выполнение обязательств перед пользователем</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-dark dark:text-white mb-3">
                4. Защита данных
              </h2>
              <p>
                Оператор принимает необходимые организационные и технические
                меры для защиты персональных данных от неправомерного доступа,
                уничтожения, изменения, блокирования, копирования,
                распространения, а также от иных неправомерных действий третьих
                лиц.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-dark dark:text-white mb-3">
                5. Передача данных третьим лицам
              </h2>
              <p>
                Оператор не передаёт персональные данные третьим лицам, за
                исключением случаев, предусмотренных законодательством
                Российской Федерации. Данные могут быть переданы государственным
                органам по их законному запросу.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-dark dark:text-white mb-3">
                6. Хранение данных
              </h2>
              <p>
                Персональные данные хранятся не дольше, чем этого требуют цели
                их обработки. По достижении целей обработки данные удаляются или
                обезличиваются.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-dark dark:text-white mb-3">
                7. Права пользователя
              </h2>
              <p>Пользователь имеет право:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Запросить информацию о хранящихся персональных данных</li>
                <li>Потребовать исправления неточных данных</li>
                <li>Потребовать удаления своих персональных данных</li>
                <li>Отозвать согласие на обработку данных</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-dark dark:text-white mb-3">
                8. Контактная информация
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
                9. Изменения в Политике
              </h2>
              <p>
                Оператор оставляет за собой право вносить изменения в настоящую
                Политику конфиденциальности. Актуальная версия Политики всегда
                доступна на данной странице.
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
