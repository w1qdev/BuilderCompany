import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Контакты",
  description:
    "Свяжитесь с Центром Стандартизации и Метрологии. Телефон, email, адрес офиса и форма обратной связи. Бесплатная консультация по услугам калибровки, поверки и аттестации.",
  openGraph: {
    title: "Контакты — ЦСМ",
    description:
      "Свяжитесь с нами для заказа калибровки, поверки и аттестации измерительного оборудования.",
  },
  alternates: {
    canonical: "/contacts",
  },
};

export default function ContactsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
