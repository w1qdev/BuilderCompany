import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Портфолио",
  description:
    "Примеры выполненных работ Центра Стандартизации и Метрологии. Калибровка, поверка и аттестация для Газпром нефть, Росатом, РЖД и других крупных предприятий.",
  openGraph: {
    title: "Портфолио — ЦСМ",
    description:
      "Более 5000 выполненных работ. Калибровка и поверка для крупнейших предприятий России.",
  },
  alternates: {
    canonical: "/portfolio",
  },
};

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
