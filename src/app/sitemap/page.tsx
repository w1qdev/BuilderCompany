import Link from "next/link";

const sections = [
  {
    title: "Основные страницы",
    links: [
      { href: "/", label: "Главная" },
      { href: "/portfolio", label: "Портфолио" },
      { href: "/contacts", label: "Контакты" },
    ],
  },
  {
    title: "Разделы главной страницы",
    links: [
      { href: "/#services", label: "Услуги" },
      { href: "/#calculator", label: "Калькулятор стоимости" },
      { href: "/#about", label: "О компании" },
      { href: "/#partners", label: "Партнёры" },
      { href: "/#contacts", label: "Контакты (на главной)" },
    ],
  },
  {
    title: "Правовая информация",
    links: [
      { href: "/privacy", label: "Политика конфиденциальности" },
    ],
  },
];

export default function SitemapPage() {
  return (
    <div className="min-h-screen bg-warm-bg">
      {/* Header */}
      <div className="gradient-dark text-white">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="font-bold">ЦСМ</span>
          </Link>
          <span className="text-white/40 text-sm">/ Карта сайта</span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-dark mb-4">
            Карта <span className="text-gradient">сайта</span>
          </h1>
          <p className="text-neutral">
            Все страницы и разделы сайта ЦСМ
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section) => (
            <div key={section.title} className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-bold text-dark mb-4">{section.title}</h2>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-neutral hover:text-primary transition-colors text-sm flex items-center gap-2"
                    >
                      <svg className="w-4 h-4 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/" className="text-primary hover:underline text-sm font-medium">
            ← Вернуться на главную
          </Link>
        </div>
      </div>
    </div>
  );
}
