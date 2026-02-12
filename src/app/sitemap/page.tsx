import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/Logo";

export const metadata: Metadata = {
  title: "Карта сайта",
  description: "Полная карта сайта Центра Стандартизации и Метрологии. Навигация по всем страницам и разделам.",
  robots: {
    index: false,
    follow: true,
  },
};

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
            <Logo size="sm" />
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
