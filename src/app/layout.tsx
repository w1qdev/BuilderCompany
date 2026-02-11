import type { Metadata } from "next";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import CookieConsent from "@/components/CookieConsent";
import { SiteSettingsProvider } from "@/lib/SiteSettingsContext";

export const metadata: Metadata = {
  title: "ЦСМ — Центр Стандартизации и Метрологии",
  description:
    "Калибровка, поверка и аттестация измерительного оборудования. Профессиональный центр метрологии с опытом более 10 лет, 5000+ выполненных работ.",
  keywords: "калибровка, поверка, аттестация, метрология, ЦСМ, измерительное оборудование",
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
          <SiteSettingsProvider>
            {children}
            <CookieConsent />
          </SiteSettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
