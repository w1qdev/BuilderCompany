"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="min-h-screen gradient-dark flex items-center justify-center p-4">
      <div className="text-center">
        {/* Animated 404 */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-[150px] sm:text-[200px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-light leading-none">
            404
          </h1>
        </motion.div>

        {/* Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <div className="w-24 h-24 mx-auto bg-white/10 rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Страница не найдена
          </h2>
          <p className="text-white/60 mb-8 max-w-md mx-auto">
            К сожалению, запрашиваемая страница не существует или была перемещена.
            Возможно, вы ввели неправильный адрес.
          </p>
        </motion.div>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            href="/"
            className="bg-primary text-white px-8 py-4 rounded-2xl font-semibold hover:bg-primary-dark transition-colors hover:scale-105"
          >
            На главную
          </Link>
          <Link
            href="/contacts"
            className="border-2 border-white/30 text-white px-8 py-4 rounded-2xl font-semibold hover:bg-white/10 transition-all"
          >
            Связаться с нами
          </Link>
        </motion.div>

        {/* Quick links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-12 pt-8 border-t border-white/10"
        >
          <p className="text-white/40 text-sm mb-4">Популярные разделы:</p>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { href: "/#services", label: "Услуги" },
              { href: "/#about", label: "О компании" },
              { href: "/portfolio", label: "Портфолио" },
              { href: "/#faq", label: "FAQ" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-white/60 hover:text-primary transition-colors text-sm"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
