import type { Metadata } from "next";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import CookieConsent from "@/components/CookieConsent";

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
    <html lang="ru" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          {children}
          <CookieConsent />
        </ThemeProvider>
      </body>
    </html>
  );
}
