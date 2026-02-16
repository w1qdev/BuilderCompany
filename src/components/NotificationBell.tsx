"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface Notification {
  id: string;
  type: "overdue" | "upcoming" | "status";
  title: string;
  description: string;
  href: string;
  urgent?: boolean;
}

const STORAGE_KEY = "notifications_read";

function getReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function markAllRead(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const [equipRes, reqRes] = await Promise.all([
          fetch("/api/equipment?limit=200"),
          fetch("/api/user/requests"),
        ]);

        const items: Notification[] = [];
        const now = new Date();
        const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

        if (equipRes.ok) {
          const equipData = await equipRes.json();
          const equipment = equipData.equipment || [];

          const overdue = equipment.filter(
            (e: { nextVerification: string }) =>
              e.nextVerification && new Date(e.nextVerification) < now,
          );
          const upcoming = equipment.filter((e: { nextVerification: string }) => {
            if (!e.nextVerification) return false;
            const d = new Date(e.nextVerification);
            return d >= now && d <= in14Days;
          });

          if (overdue.length > 0) {
            items.push({
              id: "overdue",
              type: "overdue",
              title: `${overdue.length} ед. с просроченной поверкой`,
              description: "Требуется срочная поверка",
              href: "/dashboard/equipment/si",
              urgent: true,
            });
          }
          if (upcoming.length > 0) {
            items.push({
              id: "upcoming",
              type: "upcoming",
              title: `${upcoming.length} ед. — поверка через 14 дней`,
              description: "Рекомендуем оформить заявку заранее",
              href: "/dashboard/schedule/si",
            });
          }
        }

        if (reqRes.ok) {
          const reqData = await reqRes.json();
          const requests = reqData.requests || [];
          const inProgress = requests.filter(
            (r: { status: string }) => r.status === "in_progress",
          );
          if (inProgress.length > 0) {
            items.push({
              id: "in-progress",
              type: "status",
              title: `${inProgress.length} заявки в работе`,
              description: "Статус ваших заявок обновился",
              href: "/dashboard/requests",
            });
          }
        }

        setNotifications(items);
        setReadIds(getReadIds());
      } catch {
        // ignore
      }
    };

    fetchNotifications();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  const iconColor: Record<string, string> = {
    overdue: "text-red-500 bg-red-100 dark:bg-red-900/30",
    upcoming: "text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30",
    status: "text-blue-500 bg-blue-100 dark:bg-blue-900/30",
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next && unreadCount > 0) {
            const allIds = notifications.map((n) => n.id);
            markAllRead(allIds);
            setReadIds(new Set(allIds));
          }
        }}
        className="relative p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white"
        aria-label="Уведомления"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-dark-light border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-white/10">
            <h3 className="text-sm font-semibold text-dark dark:text-white">Уведомления</h3>
          </div>
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <svg className="w-8 h-8 mx-auto text-gray-300 dark:text-white/20 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <p className="text-sm text-neutral dark:text-white/50">Нет новых уведомлений</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-white/5">
              {notifications.map((n) => (
                <li key={n.id}>
                  <Link
                    href={n.href}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${iconColor[n.type]}`}>
                      {n.type === "overdue" && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      )}
                      {n.type === "upcoming" && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                      {n.type === "status" && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-dark dark:text-white leading-tight">{n.title}</p>
                      <p className="text-xs text-neutral dark:text-white/50 mt-0.5">{n.description}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
