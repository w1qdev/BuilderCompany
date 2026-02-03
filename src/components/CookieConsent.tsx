"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      // Show banner after a short delay
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptAll = () => {
    localStorage.setItem("cookie-consent", "all");
    setShowBanner(false);
  };

  const acceptNecessary = () => {
    localStorage.setItem("cookie-consent", "necessary");
    setShowBanner(false);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25 }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-4"
        >
          <div className="max-w-4xl mx-auto bg-white dark:bg-dark-light rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="font-bold text-dark dark:text-white">Использование cookies</h3>
                </div>
                <p className="text-sm text-neutral dark:text-white/70">
                  Мы используем файлы cookie для улучшения работы сайта, анализа трафика и персонализации контента.
                  Нажимая «Принять все», вы соглашаетесь на использование всех файлов cookie.
                </p>
              </div>
              <div className="flex gap-3 shrink-0">
                <button
                  onClick={acceptNecessary}
                  className="px-4 py-2 text-sm font-medium text-dark dark:text-white border border-gray-300 dark:border-white/20 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                >
                  Только необходимые
                </button>
                <button
                  onClick={acceptAll}
                  className="px-4 py-2 text-sm font-medium text-white gradient-primary rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all"
                >
                  Принять все
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
