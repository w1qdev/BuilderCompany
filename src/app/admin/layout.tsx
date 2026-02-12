import type { Metadata } from "next";
import { AdminThemeForcer } from "./theme-forcer";

export const metadata: Metadata = {
  title: "Админ-панель",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AdminThemeForcer />
      {children}
    </>
  );
}
