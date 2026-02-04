"use client";

import Link from "next/link";
import ContactForm from "@/components/ContactForm";
import dynamic from "next/dynamic";

const YandexMap = dynamic(() => import("@/components/YandexMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 bg-gray-100 dark:bg-dark-light rounded-2xl flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  ),
});

import { useSiteSettings } from "@/lib/SiteSettingsContext";

export default function ContactsPage() {
  const { phone, email, address } = useSiteSettings();
  const telHref = `tel:+7${phone.replace(/\D/g, "").slice(1)}`;
  return (
    <div className="min-h-screen bg-warm-bg dark:bg-dark">
      {/* Header */}
      <div className="gradient-dark text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="font-bold">ЦСМ</span>
          </Link>
          <span className="text-white/40 text-sm">/ Контакты</span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-dark dark:text-white mb-4">
            Свяжитесь <span className="text-gradient">с нами</span>
          </h1>
          <p className="text-neutral dark:text-white/60 max-w-2xl mx-auto">
            Оставьте заявку или свяжитесь с нами любым удобным способом.
            Мы ответим в ближайшее время.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Contact info */}
          <div className="space-y-6">
            {/* Info cards */}
            <div className="bg-white dark:bg-dark-light rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-bold text-dark dark:text-white mb-4">Контактная информация</h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-dark dark:text-white text-sm">Адрес</p>
                    <p className="text-neutral dark:text-white/60 text-sm">{address}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-dark dark:text-white text-sm">Телефон</p>
                    <a href={telHref} className="text-primary hover:underline text-sm">{phone}</a>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-dark dark:text-white text-sm">Email</p>
                    <a href={`mailto:${email}`} className="text-primary hover:underline text-sm">{email}</a>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-dark dark:text-white text-sm">Время работы</p>
                    <p className="text-neutral dark:text-white/60 text-sm">Пн-Пт: 9:00 - 18:00</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Yandex Map */}
            <div className="bg-white dark:bg-dark-light rounded-2xl shadow-lg overflow-hidden h-80">
              <YandexMap
                center={[55.751244, 37.618423]}
                zoom={16}
                address={address}
              />
            </div>
          </div>

          {/* Contact form */}
          <div className="bg-white dark:bg-dark-light rounded-2xl shadow-lg p-6 sm:p-8">
            <h2 className="text-lg font-bold text-dark dark:text-white mb-6">Оставить заявку</h2>
            <ContactForm />
          </div>
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
