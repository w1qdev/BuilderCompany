import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Политика конфиденциальности",
  description:
    "Политика обработки и защиты персональных данных Центра Стандартизации и Метрологии в соответствии с 152-ФЗ.",
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
