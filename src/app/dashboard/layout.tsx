"use client";

import BugReportButton from "@/components/BugReportButton";
import CommandSearch from "@/components/CommandSearch";
import FeedbackModal from "@/components/FeedbackModal";
import Logo from "@/components/Logo";
import NotificationBell from "@/components/NotificationBell";
import { useTheme } from "@/components/ThemeProvider";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface User {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  company: string | null;
  avatar: string | null;
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
    label: "СИ",
    icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
  },
  {
    href: "/dashboard/schedule/si",
    label: "График поверки (СИ)",
    icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  },
  // ARSHIN_ENABLED: Hidden until integration is ready
  // {
  //   href: "/dashboard/arshin-registry",
  //   label: "Реестр поверок (Аршин)",
  //   icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  // },
  { type: "divider", label: "Испытательное оборудование" },
  {
    href: "/dashboard/equipment/io",
    label: "Оборудование (ИО)",
    icon: "M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z",
  },
  {
    href: "/dashboard/schedule/io",
    label: "График аттестации (ИО)",
    icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  },
  { type: "divider", label: "Организация" },
  {
    href: "/dashboard/organization",
    label: "Моя организация",
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  },
  { type: "divider", label: "Заявки и аналитика" },
  {
    href: "/dashboard/requests",
    label: "Мои заявки",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  {
    href: "/dashboard/analytics",
    label: "Аналитика",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  },
  // Tools group hidden from sidebar
  // {
  //   type: "group",
  //   label: "Инструменты",
  //   icon: "M11.42 15.17l-1.42 1.42a2 2 0 11-2.83-2.83l1.42-1.42M15.17 11.42l1.42-1.42a2 2 0 10-2.83-2.83l-1.42 1.42M8.29 15.71l7.42-7.42",
  //   children: [...],
  // },
];

const breadcrumbMap: Record<string, string> = {
  "/dashboard": "Обзор",
  "/dashboard/equipment/si": "Оборудование СИ",
  "/dashboard/equipment/io": "Оборудование ИО",
  "/dashboard/schedule/si": "График поверки СИ",
  "/dashboard/schedule/io": "График аттестации ИО",
  "/dashboard/requests": "Мои заявки",
  "/dashboard/analytics": "Аналитика",
  "/dashboard/notifications": "Настройки уведомлений",
  "/dashboard/profile": "Профиль",
  "/dashboard/companies": "Справочник организаций",
  "/dashboard/organization": "Моя организация",
  "/dashboard/calculator": "Калькулятор",
  "/dashboard/converter": "Конвертер единиц",
  "/dashboard/accuracy": "Классы точности",
  "/dashboard/uncertainty": "Неопределённость",
  "/dashboard/protocol": "Генератор протоколов",
  "/dashboard/gosts": "Справочник ГОСТов",
  "/dashboard/documents": "Шаблоны документов",
  "/dashboard/mpi": "Калькулятор МПИ",
  // "/dashboard/arshin-registry": "Реестр поверок (Аршин)", // ARSHIN_ENABLED
};


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme: currentTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebar-collapsed") === "true";
    }
    return false;
  });
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const toggleCollapsed = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  };

  // Ctrl+K / Cmd+K global shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        <div role="status" aria-label="Загрузка" className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-xs text-neutral dark:text-white/50">Загрузка...</span>
        </div>
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
        className={`group/nav relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
          active
            ? "bg-primary text-white shadow-md shadow-primary/20"
            : "text-neutral dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/5"
        } ${nested ? "pl-5" : ""} ${sidebarCollapsed ? "justify-center" : ""}`}
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
        {!sidebarCollapsed && <span>{item.label}</span>}
        {sidebarCollapsed && (
          <div className="absolute left-full ml-2 px-2.5 py-1.5 rounded-lg bg-dark dark:bg-white text-white dark:text-dark text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover/nav:opacity-100 transition-opacity z-50 shadow-lg">
            {item.label}
          </div>
        )}
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
              className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
              title="Поиск (Ctrl+K)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="hidden sm:inline text-xs text-white/40">Ctrl+K</span>
            </button>
            <NotificationBell />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar overlay for mobile */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <aside
          className={`fixed lg:sticky top-[52px] lg:top-[52px] left-0 z-30 h-[calc(100vh-52px)] bg-white dark:bg-dark-light border-r border-gray-200 dark:border-white/10 flex flex-col transition-all duration-300 lg:translate-x-0 lg:overflow-visible overflow-x-hidden ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } ${sidebarCollapsed ? "lg:w-[68px] w-64" : "w-64"}`}
        >
          {/* Collapse toggle button — desktop only */}
          <button
            onClick={toggleCollapsed}
            className="hidden lg:flex absolute -right-3.5 top-5 z-40 w-7 h-7 rounded-full bg-white dark:bg-dark-light border border-gray-200 dark:border-white/10 shadow-md items-center justify-center text-neutral dark:text-white/60 hover:text-primary hover:border-primary/30 transition-colors"
            title={sidebarCollapsed ? "Развернуть" : "Свернуть"}
          >
            <svg className={`w-4 h-4 transition-transform duration-300 ${sidebarCollapsed ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <nav className={`flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-1 ${sidebarCollapsed ? "lg:px-2" : ""}`}>
            {navItems.map((item, index) => {
              if ("type" in item && item.type === "divider") {
                return sidebarCollapsed ? (
                  <div key={index} className="hidden lg:block pt-4 pb-2 px-3">
                    <div className="border-t border-gray-200 dark:border-white/10" />
                  </div>
                ) : (
                  <div key={index} className="pt-4 pb-2 px-3">
                    <span className="text-xs font-semibold text-neutral dark:text-white/40 uppercase tracking-wider">
                      {item.label}
                    </span>
                  </div>
                );
              }

              if ("type" in item && item.type === "group") {
                return null;
              }

              if (!("href" in item)) return null;

              return renderNavLink(item as NavLink);
            })}
          </nav>

          {/* Feedback button — fixed above profile, never scrolls */}
          <div className={`shrink-0 py-2 ${sidebarCollapsed ? "lg:px-2 px-4" : "px-4"}`}>
            <button
              onClick={() => {
                setFeedbackOpen(true);
                setSidebarOpen(false);
              }}
              className={`group/nav relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors ${sidebarCollapsed ? "lg:justify-center" : ""}`}
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
                  d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              {!sidebarCollapsed && <span>Замечания</span>}
              {sidebarCollapsed && (
                <div className="hidden lg:block absolute left-full ml-2 px-2.5 py-1.5 rounded-lg bg-dark dark:bg-white text-white dark:text-dark text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover/nav:opacity-100 transition-opacity z-50 shadow-lg">
                  Замечания
                </div>
              )}
            </button>
          </div>

          {/* Profile */}
          <div
            ref={profileRef}
            className={`relative border-t border-gray-200 dark:border-white/10 p-3 ${sidebarCollapsed ? "lg:px-2" : ""}`}
          >
            {profileOpen && (
              <div className={`absolute bottom-full mb-1 bg-white dark:bg-dark-light border border-gray-200 dark:border-white/10 rounded-xl shadow-lg py-1 ${sidebarCollapsed ? "lg:left-full lg:bottom-0 lg:ml-2 lg:mb-0 lg:w-48 left-3 right-3" : "left-3 right-3"}`}>
                <Link
                  href="/dashboard/profile"
                  onClick={() => {
                    setProfileOpen(false);
                    setSidebarOpen(false);
                  }}
                  className="block px-4 py-2 text-sm text-neutral dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  Профиль
                </Link>
                <div className="border-t border-gray-100 dark:border-white/5 my-1" />
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  Выйти
                </button>
              </div>
            )}
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className={`group/nav relative w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${sidebarCollapsed ? "lg:justify-center" : ""}`}
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold shrink-0 overflow-hidden">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              {!sidebarCollapsed && (
                <>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-sm font-medium text-dark dark:text-white truncate">
                      {user.name}
                    </div>
                    {user.company && (
                      <div className="text-xs text-neutral dark:text-white/40 truncate">
                        {user.company}
                      </div>
                    )}
                  </div>
                  <svg
                    className={`w-4 h-4 shrink-0 text-gray-400 transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                </>
              )}
              {sidebarCollapsed && (
                <div className="hidden lg:block absolute left-full ml-2 px-2.5 py-1.5 rounded-lg bg-dark dark:bg-white text-white dark:text-dark text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover/nav:opacity-100 transition-opacity z-50 shadow-lg">
                  {user.name}
                </div>
              )}
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          {pathname !== "/dashboard" && breadcrumbMap[pathname] && (
            <nav aria-label="Навигация" className="flex items-center gap-1.5 text-sm text-neutral dark:text-white/40 mb-4">
              <ol className="flex items-center gap-1.5">
                <li>
                  <Link
                    href="/dashboard"
                    className="hover:text-primary transition-colors"
                  >
                    Обзор
                  </Link>
                </li>
                <li aria-hidden="true">
                  <svg
                    className="w-3.5 h-3.5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </li>
                {(() => {
                  const parts = pathname.split("/").filter(Boolean);
                  if (parts.length > 2) {
                    const parent = "/" + parts.slice(0, 2).join("/");
                    if (breadcrumbMap[parent]) {
                      return (
                        <>
                          <li>
                            <Link
                              href={parent}
                              className="hover:text-primary transition-colors"
                            >
                              {breadcrumbMap[parent]}
                            </Link>
                          </li>
                          <li aria-hidden="true">
                            <svg
                              className="w-3.5 h-3.5 shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </li>
                        </>
                      );
                    }
                  }
                  return null;
                })()}
                <li aria-current="page">
                  <span className="text-dark dark:text-white/70 font-medium">
                    {breadcrumbMap[pathname]}
                  </span>
                </li>
              </ol>
            </nav>
          )}
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <CommandSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
      <BugReportButton />
    </div>
  );
}
