import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ЦСМ — Центр Стандартизации и Метрологии",
  description:
    "Калибровка, поверка и сертификация измерительного оборудования. Аккредитованный центр с опытом более 10 лет, 5000+ выданных сертификатов.",
  keywords: "калибровка, поверка, сертификация, метрология, ЦСМ, измерительное оборудование",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased">{children}</body>
    </html>
  );
}
