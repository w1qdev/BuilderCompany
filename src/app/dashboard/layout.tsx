"use client";

import Logo from "@/components/Logo";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface User {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  company: string | null;
}

type NavLink = {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
};

type NavDivider = {
  type: "divider";
  label: string;
};

type NavGroup = {
  type: "group";
  label: string;
  icon: string;
  children: NavLink[];
};

type NavItem = NavLink | NavDivider | NavGroup;

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Обзор",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    exact: true,
  },
  { type: "divider", label: "Средства измерений" },
  {
    href: "/dashboard/equipment/si",
    label: "Оборудование СИ",
    icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
  },
  {
    href: "/dashboard/schedule/si",
    label: "График поверки СИ",
    icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  },
  { type: "divider", label: "Испытательное оборудование" },
  {
    href: "/dashboard/equipment/io",
    label: "Оборудование ИО",
    icon: "M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z",
  },
  {
    href: "/dashboard/schedule/io",
    label: "График аттестации ИО",
    icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  },
  { type: "divider", label: "Заявки" },
  {
    href: "/dashboard/requests",
    label: "Мои заявки",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  {
    type: "group",
    label: "Инструменты",
    icon: "M11.42 15.17l-1.42 1.42a2 2 0 11-2.83-2.83l1.42-1.42M15.17 11.42l1.42-1.42a2 2 0 10-2.83-2.83l-1.42 1.42M8.29 15.71l7.42-7.42",
    children: [
      {
        href: "/dashboard/calculator",
        label: "Калькулятор",
        icon: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z",
      },
      {
        href: "/dashboard/converter",
        label: "Конвертер единиц",
        icon: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4",
      },
      {
        href: "/dashboard/accuracy",
        label: "Классы точности",
        icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
      },
      {
        href: "/dashboard/uncertainty",
        label: "Неопределённость",
        icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      },
      {
        href: "/dashboard/protocol",
        label: "Генератор протоколов",
        icon: "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z",
      },
      {
        href: "/dashboard/gosts",
        label: "Справочник ГОСТов",
        icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
      },
    ],
  },
];

const toolPaths = [
  "/dashboard/calculator",
  "/dashboard/converter",
  "/dashboard/accuracy",
  "/dashboard/uncertainty",
  "/dashboard/protocol",
  "/dashboard/gosts",
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isToolActive = toolPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
  const [toolsOpen, setToolsOpen] = useState(isToolActive);

  useEffect(() => {
    if (isToolActive) setToolsOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) {
          router.push("/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) setUser(data.user);
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-bg dark:bg-dark flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  };

  const renderNavLink = (item: NavLink, nested = false) => {
    const active = isActive(item.href, item.exact);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setSidebarOpen(false)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
          active
            ? "gradient-primary text-white shadow-md shadow-primary/20"
            : "text-neutral dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/5"
        } ${nested ? "pl-5" : ""}`}
      >
        <svg
          className="w-5 h-5 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d={item.icon}
          />
        </svg>
        {item.label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-warm-bg dark:bg-dark">
      {/* Header */}
      <header className="gradient-dark text-white sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {sidebarOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
            <Link href="/" className="flex items-center gap-2">
              <Logo size="sm" />
            </Link>
            <span className="text-white/40 text-sm hidden sm:inline">
              / Личный кабинет
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm text-white/70">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span>{user.name}</span>
              {user.company && (
                <span className="text-white/40">({user.company})</span>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed lg:sticky top-[52px] lg:top-[52px] left-0 z-30 h-[calc(100vh-52px)] w-64 bg-white dark:bg-dark-light border-r border-gray-200 dark:border-white/10 overflow-y-auto transition-transform lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <nav className="p-4 space-y-1">
            {navItems.map((item, index) => {
              if ("type" in item && item.type === "divider") {
                return (
                  <div key={index} className="pt-4 pb-2 px-3">
                    <span className="text-xs font-semibold text-neutral dark:text-white/40 uppercase tracking-wider">
                      {item.label}
                    </span>
                  </div>
                );
              }

              if ("type" in item && item.type === "group") {
                return (
                  <div key={index} className="pt-4">
                    <button
                      onClick={() => setToolsOpen(!toolsOpen)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        isToolActive && !toolsOpen
                          ? "text-primary dark:text-primary"
                          : "text-neutral dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <svg
                          className="w-5 h-5 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d={item.icon}
                          />
                        </svg>
                        {item.label}
                      </div>
                      <svg
                        className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                          toolsOpen ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                    {toolsOpen && (
                      <div className="mt-1 ml-2 pl-3 border-l-2 border-gray-200 dark:border-white/10 space-y-1">
                        {item.children.map((child) =>
                          renderNavLink(child, true),
                        )}
                      </div>
                    )}
                  </div>
                );
              }

              if (!("href" in item)) return null;

              return renderNavLink(item as NavLink);
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
