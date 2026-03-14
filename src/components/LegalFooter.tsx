"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const PAGES_WITH_FOOTER = ["/"];

export default function LegalFooter() {
  const pathname = usePathname();

  // Skip on pages that already have the main Footer with these links
  if (PAGES_WITH_FOOTER.includes(pathname)) return null;

  // Skip on admin and dashboard pages
  if (pathname.startsWith("/admin")) return null;
  if (pathname.startsWith("/dashboard")) return null;

  return (
    <div className="w-full border-t border-gray-200 dark:border-white/10 bg-white/80 dark:bg-dark-light/80 backdrop-blur-sm">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap gap-x-6 gap-y-1 justify-center text-xs text-neutral dark:text-white/40">
        <Link href="/privacy" className="hover:text-primary transition-colors">
          Политика конфиденциальности
        </Link>
        <Link href="/privacy#cookies" className="hover:text-primary transition-colors">
          Политика cookie
        </Link>
        <Link href="/terms" className="hover:text-primary transition-colors">
          Пользовательское соглашение
        </Link>
      </div>
    </div>
  );
}
