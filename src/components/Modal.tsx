"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import ContactForm from "./ContactForm";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialValues?: {
    name?: string;
    phone?: string;
    email?: string;
  };
}

export default function Modal({
  isOpen,
  onClose,
  onSuccess,
  initialValues,
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-white dark:bg-dark-light rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors z-10"
            >
              <svg
                className="w-4 h-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div className="p-6 sm:p-8">
              <div className="text-center mb-6">
                <div className="w-14 h-14 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-7 h-7 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-extrabold text-dark dark:text-white">
                  Оставить заявку
                </h3>
                <p className="text-neutral dark:text-white/60 text-sm mt-1">
                  Если в расчёте стоимости поверки Вы не нашли интересующий тип
                  приборов или модель, это не означает что мы не сможем поверить
                  её. Вам необходимо воспользоваться функцией Заказать поверку и
                  в произвольной форме в комментариях указать какие
                  метрологические услуги требуются либо в произвольной форме
                  отправить запрос на элетронную почту zakaz@csm-center.ru
                </p>
              </div>

              <ContactForm
                onSuccess={onSuccess || onClose}
                initialValues={initialValues}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
