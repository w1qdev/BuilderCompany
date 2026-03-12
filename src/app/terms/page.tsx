"use client";

import Logo from "@/components/Logo";
import { useSiteSettings } from "@/lib/SiteSettingsContext";
import Link from "next/link";

export default function TermsPage() {
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
            / Пользовательское соглашение
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white dark:bg-dark-light rounded-2xl shadow-lg p-8 sm:p-12">
          <h1 className="text-3xl font-extrabold text-dark dark:text-white mb-8">
            Пользовательское соглашение
          </h1>

          <div className="space-y-6 text-neutral dark:text-white/60 text-sm leading-relaxed">
            <section>
              <h2 className="text-lg font-bold text-dark dark:text-white mb-3">
                1. Общие положения
              </h2>
              <p>
                Настоящее Пользовательское соглашение (далее — «Соглашение»)
                регулирует отношения между администрацией сайта «ЦСМ — Центр
                Стандартизации и Метрологии» (далее — «Администрация»),
                расположенного по адресу csm-center.ru (далее — «Сайт»), и
                пользователем сети Интернет (далее — «Пользователь»).
              </p>
              <p className="mt-2">
                Использование Сайта означает полное и безоговорочное принятие
                Пользователем условий настоящего Соглашения. В случае несогласия
                с условиями Соглашения Пользователь должен прекратить
                использование Сайта.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-dark dark:text-white mb-3">
                2. Предмет Соглашения
              </h2>
              <p>
                Администрация предоставляет Пользователю доступ к информационным
                материалам Сайта, а также к функциональным возможностям,
                включая:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Ознакомление с информацией об услугах метрологического центра</li>
                <li>Отправку заявок на поверку, калибровку и аттестацию оборудования</li>
                <li>Использование онлайн-калькулятора стоимости услуг</li>
                <li>Регистрацию и использование личного кабинета</li>
                <li>Загрузку файлов и документов для обработки заявок</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-dark dark:text-white mb-3">
                3. Права и обязанности Пользователя
              </h2>
              <h3 className="font-semibold text-dark dark:text-white mt-3 mb-1">
                3.1. Пользователь имеет право:
              </h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Свободно пользоваться доступными функциями Сайта</li>
                <li>Регистрировать учётную запись и пользоваться личным кабинетом</li>
                <li>Получать информацию о статусе своих заявок</li>
                <li>Обращаться к Администрации за разъяснениями и поддержкой</li>
              </ul>
              <h3 className="font-semibold text-dark dark:text-white mt-3 mb-1">
                3.2. Пользователь обязуется:
              </h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Предоставлять достоверные данные при заполнении форм и регистрации</li>
                <li>Не использовать Сайт в целях, противоречащих законодательству РФ</li>
                <li>Не предпринимать действий, нарушающих нормальную работу Сайта</li>
                <li>Не пытаться получить несанкционированный доступ к функциям Сайта, учётным записям других пользователей или серверу</li>
                <li>Обеспечить конфиденциальность данных своей учётной записи (логин, пароль)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-dark dark:text-white mb-3">
                4. Права и обязанности Администрации
              </h2>
              <h3 className="font-semibold text-dark dark:text-white mt-3 mb-1">
                4.1. Администрация имеет право:
              </h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Изменять, дополнять и обновлять Сайт и его функциональность без предварительного уведомления</li>
                <li>Ограничить доступ Пользователя к Сайту в случае нарушения условий Соглашения</li>
                <li>Удалять заявки и учётные записи, содержащие заведомо ложные или некорректные данные</li>
              </ul>
              <h3 className="font-semibold text-dark dark:text-white mt-3 mb-1">
                4.2. Администрация обязуется:
              </h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Обеспечивать работоспособность Сайта, за исключением случаев технического обслуживания и обстоятельств непреодолимой силы</li>
                <li>Обрабатывать персональные данные Пользователей в соответствии с{" "}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Политикой конфиденциальности
                  </Link>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-dark dark:text-white mb-3">
                5. Интеллектуальная собственность
              </h2>
              <p>
                Все материалы, размещённые на Сайте (тексты, изображения, логотипы,
                элементы дизайна, программный код), являются объектами
                интеллектуальной собственности Администрации или её партнёров.
              </p>
              <p className="mt-2">
                Копирование, воспроизведение, распространение или иное
                использование материалов Сайта без письменного согласия
                Администрации запрещено.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-dark dark:text-white mb-3">
                6. Ограничение ответственности
              </h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Сайт предоставляется на условиях «как есть». Администрация не гарантирует бесперебойную работу Сайта</li>
                <li>Администрация не несёт ответственности за возможные убытки, возникшие в результате использования или невозможности использования Сайта</li>
                <li>Информация на Сайте носит справочный характер и не является публичной офертой, если иное не указано явно</li>
                <li>Расчёты, выполненные с помощью калькулятора на Сайте, являются предварительными и не являются окончательной стоимостью услуг</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-dark dark:text-white mb-3">
                7. Персональные данные и файлы cookie
              </h2>
              <p>
                Обработка персональных данных Пользователя осуществляется в
                соответствии с{" "}
                <Link href="/privacy" className="text-primary hover:underline">
                  Политикой конфиденциальности
                </Link>
                .
              </p>
              <p className="mt-2">
                Сайт использует файлы cookie для обеспечения работы авторизации.
                Подробная информация об использовании cookie доступна в{" "}
                <Link href="/privacy#cookies" className="text-primary hover:underline">
                  разделе о cookie
                </Link>{" "}
                Политики конфиденциальности.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-dark dark:text-white mb-3">
                8. Разрешение споров
              </h2>
              <p>
                Все споры и разногласия, возникающие в связи с использованием
                Сайта, разрешаются путём переговоров. В случае невозможности
                достижения соглашения споры подлежат рассмотрению в соответствии
                с законодательством Российской Федерации.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-dark dark:text-white mb-3">
                9. Контактная информация
              </h2>
              <p>
                По вопросам, связанным с использованием Сайта, вы можете
                обратиться:
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
                10. Заключительные положения
              </h2>
              <p>
                Администрация оставляет за собой право вносить изменения в
                настоящее Соглашение. Актуальная версия Соглашения всегда
                доступна на данной странице. Продолжение использования Сайта
                после внесения изменений означает принятие новых условий.
              </p>
              <p className="mt-2">
                Дата последнего обновления: март 2026 г.
              </p>
            </section>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-100 dark:border-white/10">
            <Link
              href="/"
              className="text-primary hover:underline text-sm font-medium"
            >
              &larr; Вернуться на главную
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
