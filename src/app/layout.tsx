import type { Metadata } from "next";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import CookieConsent from "@/components/CookieConsent";
import PageViewTracker from "@/components/PageViewTracker";
import { SiteSettingsProvider } from "@/lib/SiteSettingsContext";
import { Toaster } from "sonner";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://csm-center.ru";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ЦСМ — Центр Стандартизации и Метрологии",
    template: "%s | ЦСМ",
  },
  description:
    "Калибровка, поверка и аттестация измерительного оборудования. Профессиональный центр метрологии с опытом более 10 лет, 5000+ выполненных работ.",
  keywords: [
    "калибровка",
    "поверка",
    "аттестация",
    "метрология",
    "ЦСМ",
    "измерительное оборудование",
    "сертификация",
    "испытательное оборудование",
    "средства измерений",
    "ГОСТ",
  ],
  authors: [{ name: "ЦСМ — Центр Стандартизации и Метрологии" }],
  creator: "ЦСМ",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: SITE_URL,
    siteName: "ЦСМ — Центр Стандартизации и Метрологии",
    title: "ЦСМ — Центр Стандартизации и Метрологии",
    description:
      "Калибровка, поверка и аттестация измерительного оборудования. Профессиональный центр метрологии с опытом более 10 лет.",
    images: [
      {
        url: `${SITE_URL}/images/hero/hero-1.webp`,
        width: 1200,
        height: 630,
        alt: "ЦСМ — Центр Стандартизации и Метрологии",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ЦСМ — Центр Стандартизации и Метрологии",
    description:
      "Калибровка, поверка и аттестация измерительного оборудования.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "ЦСМ — Центр Стандартизации и Метрологии",
  description:
    "Калибровка, поверка и аттестация измерительного оборудования. Профессиональный центр метрологии.",
  url: SITE_URL,
  telephone: "+7 (966) 730-30-03",
  email: "zakaz@csm-center.ru",
  address: {
    "@type": "PostalAddress",
    streetAddress: "ул. Маневровая, 9",
    addressLocality: "Екатеринбург",
    addressRegion: "Свердловская область",
    addressCountry: "RU",
  },
  priceRange: "₽₽",
  serviceArea: {
    "@type": "Country",
    name: "Россия",
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Метрологические услуги",
    itemListElement: [
      {
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: "Калибровка средств измерений" },
      },
      {
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: "Поверка средств измерений" },
      },
      {
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: "Аттестация испытательного оборудования" },
      },
    ],
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Какие виды оборудования вы калибруете?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Мы калибруем широкий спектр средств измерений: манометры, термометры, весы, мультиметры, осциллографы, счётчики, расходомеры и многое другое.",
      },
    },
    {
      "@type": "Question",
      name: "Сколько времени занимает калибровка?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Стандартные сроки калибровки — 5-10 рабочих дней. Для срочных заказов предусмотрена ускоренная калибровка за 3-5 рабочих дней.",
      },
    },
    {
      "@type": "Question",
      name: "Чем отличается калибровка от поверки?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Поверка — обязательная процедура для СИ в сферах государственного регулирования. Калибровка — добровольная процедура для обеспечения точности измерений.",
      },
    },
    {
      "@type": "Question",
      name: "Вы работаете с выездом к заказчику?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Да, мы проводим калибровку и поверку на территории заказчика по всей России.",
      },
    },
    {
      "@type": "Question",
      name: "Какие документы я получу после калибровки?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "После калибровки выдаётся сертификат калибровки. При поверке — свидетельство о поверке с записью в реестр ФГИС «Аршин».",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <meta name="yandex-verification" content="2089f58e8d621be4" />
        <meta name="google-site-verification" content="" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#f97316" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var d=["dark-chocolate","deep-ocean","night-forest","midnight","graphite","obsidian","aurora","crimson-night","cyber","plum","mocha","nord"];var isDash=location.pathname.startsWith("/dashboard");var t=isDash?(localStorage.getItem("theme")||"warm-orange"):"warm-orange";document.documentElement.setAttribute("data-theme",t);if(d.indexOf(t)!==-1){document.documentElement.classList.add("dark")}if(isDash){var fs={"small":"14px","medium":"16px","large":"18px"};var sz=localStorage.getItem("fontSize");if(sz&&fs[sz]){document.documentElement.style.setProperty("--font-size-base",fs[sz])}if(localStorage.getItem("compactMode")==="true"){document.documentElement.classList.add("compact")}}}catch(e){}})()`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      </head>
      <body className="antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js')})}`,
          }}
        />
        <ThemeProvider>
          <SiteSettingsProvider>
            {children}
            <PageViewTracker />
            <CookieConsent />
            <Toaster richColors position="top-center" />
          </SiteSettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
