"use client";

export default function Footer({ onOpenModal }: { onOpenModal: () => void }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="contacts" className="gradient-dark text-white">
      {/* CTA strip */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl sm:text-3xl font-extrabold mb-2">
              Готовы начать{" "}
              <span className="text-gradient">строительство?</span>
            </h3>
            <p className="text-white/60">
              Оставьте заявку и получите бесплатную консультацию
            </p>
          </div>
          <button
            onClick={onOpenModal}
            className="gradient-primary text-white px-8 py-4 rounded-2xl font-semibold hover:shadow-xl hover:shadow-primary/30 transition-all hover:scale-105 whitespace-nowrap"
          >
            Оставить заявку
          </button>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="font-bold text-xl">
                ЦСМ «Центр Стандартизации и Метрологии»
              </span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed">
              Надёжный партнёр в строительстве с 2009 года. Полный спектр
              строительных услуг для частных и коммерческих объектов.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-bold text-lg mb-4">Навигация</h4>
            <ul className="space-y-2">
              {[
                { href: "#services", label: "Услуги" },
                { href: "#calculator", label: "Калькулятор" },
                { href: "/portfolio", label: "Портфолио" },
                { href: "#about", label: "О компании" },
                { href: "#partners", label: "Партнёры" },
                { href: "/contacts", label: "Контакты" },
              ].map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-white/60 hover:text-primary transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-bold text-lg mb-4">Услуги</h4>
            <ul className="space-y-2">
              {[
                "Строительство",
                "Ремонт",
                "Проектирование",
                "Дизайн",
                "Кровля",
                "Фасады",
              ].map((s) => (
                <li key={s}>
                  <a
                    href="#services"
                    className="text-white/60 hover:text-primary transition-colors text-sm"
                  >
                    {s}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacts */}
          <div>
            <h4 className="font-bold text-lg mb-4">Контакты</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-primary shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="text-white/60 text-sm">
                  г. Москва, ул. Строителей, д. 15, офис 301
                </span>
              </li>
              <li>
                <a
                  href="tel:+78001234567"
                  className="flex items-center gap-2 text-white/60 hover:text-primary transition-colors text-sm"
                >
                  <svg
                    className="w-5 h-5 text-primary shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  8 (800) 123-45-67
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@stroycompany.ru"
                  className="flex items-center gap-2 text-white/60 hover:text-primary transition-colors text-sm"
                >
                  <svg
                    className="w-5 h-5 text-primary shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  info@stroycompany.ru
                </a>
              </li>
              <li className="flex items-center gap-2 text-white/60 text-sm">
                <svg
                  className="w-5 h-5 text-primary shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Пн-Пт: 9:00 - 18:00
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-sm">
            &copy; {currentYear} СтройКомпани. Все права защищены.
          </p>
          <div className="flex gap-6">
            <a
              href="/privacy"
              className="text-white/40 hover:text-primary transition-colors text-sm"
            >
              Политика конфиденциальности
            </a>
            <a
              href="/sitemap"
              className="text-white/40 hover:text-primary transition-colors text-sm"
            >
              Карта сайта
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
