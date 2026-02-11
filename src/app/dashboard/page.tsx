"use client";

import Modal from "@/components/Modal";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface User {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  company: string | null;
  createdAt: string;
}

interface Request {
  id: number;
  name: string;
  phone: string;
  email: string;
  service: string;
  message: string | null;
  fileName: string | null;
  filePath: string | null;
  status: string;
  createdAt: string;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  new: { label: "Новая", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  in_progress: { label: "В работе", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  done: { label: "Выполнена", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
};

const referenceLinks = [
  // {
  //   title: "Справочник ГОСТов",
  //   description: "Государственные стандарты в области метрологии",
  //   href: "/dashboard/gosts",
  //   icon: (
  //     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  //     </svg>
  //   ),
  // },
  {
    title: "Классы точности",
    description: "Таблицы классов точности измерительных приборов",
    href: "/dashboard/accuracy",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    title: "Калькулятор погрешностей",
    description: "Расчёт погрешностей измерений",
    href: "/dashboard/calculator",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: "Конвертер единиц",
    description: "Перевод единиц измерения",
    href: "/dashboard/converter",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"requests" | "reference">("requests");
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, requestsRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/user/requests"),
        ]);

        if (!userRes.ok) {
          router.push("/login");
          return;
        }

        const userData = await userRes.json();
        setUser(userData.user);

        if (requestsRes.ok) {
          const requestsData = await requestsRes.json();
          setRequests(requestsData.requests);
          setTotalPages(requestsData.pages || 1);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  const refreshRequests = async () => {
    const res = await fetch("/api/user/requests");
    if (res.ok) {
      const data = await res.json();
      setRequests(data.requests);
      setPage(1);
      setTotalPages(data.pages || 1);
    }
  };

  const loadMore = async () => {
    const nextPage = page + 1;
    const res = await fetch(`/api/user/requests?page=${nextPage}`);
    if (res.ok) {
      const data = await res.json();
      setRequests((prev) => [...prev, ...data.requests]);
      setPage(nextPage);
      setTotalPages(data.pages || 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-bg dark:bg-dark flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-bg dark:bg-dark">
      {/* Header */}
      <div className="gradient-dark text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="font-bold">ЦСМ</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-white/70 hidden sm:block">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-white/70 hover:text-white transition-colors"
            >
              Выйти
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-dark dark:text-white mb-2">
            Добро пожаловать, {user?.name}!
          </h1>
          <p className="text-neutral dark:text-white/70">
            Управляйте своими заявками и получайте доступ к справочной информации
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("requests")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === "requests"
                ? "gradient-primary text-white shadow-lg shadow-primary/30"
                : "bg-white dark:bg-dark-light text-dark dark:text-white hover:bg-gray-100 dark:hover:bg-white/10"
            }`}
          >
            Мои заявки
          </button>
          <button
            onClick={() => setActiveTab("reference")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === "reference"
                ? "gradient-primary text-white shadow-lg shadow-primary/30"
                : "bg-white dark:bg-dark-light text-dark dark:text-white hover:bg-gray-100 dark:hover:bg-white/10"
            }`}
          >
            Справочная информация
          </button>
        </div>

        {/* Requests Tab */}
        {activeTab === "requests" && (
          <>
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 gradient-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-primary/30 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Новая заявка
              </button>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {requests.length === 0 ? (
                <div className="bg-white dark:bg-dark-light rounded-2xl shadow-lg p-8 text-center">
                  <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-white/20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-dark dark:text-white mb-2">
                    У вас пока нет заявок
                  </h3>
                  <p className="text-neutral dark:text-white/70">
                    Нажимайте кнопку «Новая заявка», чтобы создать заявку
                  </p>
                </div>
              ) : (
              requests.map((request, index) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-dark-light rounded-2xl shadow-lg p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="font-semibold text-dark dark:text-white">
                        {request.service}
                      </h3>
                      <p className="text-sm text-neutral dark:text-white/70">
                        Заявка #{request.id} от{" "}
                        {new Date(request.createdAt).toLocaleDateString("ru-RU", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        statusLabels[request.status]?.color || statusLabels.new.color
                      }`}
                    >
                      {statusLabels[request.status]?.label || "Новая"}
                    </span>
                  </div>
                  {request.message && (
                    <p className="text-sm text-neutral dark:text-white/70 bg-gray-50 dark:bg-white/5 rounded-xl p-3">
                      {request.message}
                    </p>
                  )}
                  {request.fileName && request.filePath && (
                    <a
                      href={request.filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline mt-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      {request.fileName}
                    </a>
                  )}
                </motion.div>
              ))
            )}
              {page < totalPages && (
                <div className="text-center pt-4">
                  <button
                    onClick={loadMore}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-white dark:bg-dark-light text-dark dark:text-white shadow-lg hover:shadow-xl transition-all"
                  >
                    Загрузить ещё
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}

        {/* Reference Tab */}
        {activeTab === "reference" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid sm:grid-cols-2 gap-4"
          >
            {referenceLinks.map((item, index) => (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  href={item.href}
                  className="block bg-white dark:bg-dark-light rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-dark dark:text-white mb-1 group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-sm text-neutral dark:text-white/70">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Back link */}
        <div className="mt-8 text-center">
          <Link href="/" className="text-primary hover:underline text-sm font-medium">
            ← Вернуться на главную
          </Link>
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          setModalOpen(false);
          refreshRequests();
        }}
        initialValues={{ name: user?.name || "", phone: user?.phone || "", email: user?.email || "" }}
      />
    </div>
  );
}
