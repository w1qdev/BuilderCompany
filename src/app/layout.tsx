import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "СтройКомпани — строительные услуги под ключ",
  description:
    "Полный спектр строительных услуг: строительство домов, ремонт, проектирование. Более 15 лет опыта, 500+ реализованных проектов.",
  keywords: "строительство, ремонт, проектирование, строительная компания",
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
