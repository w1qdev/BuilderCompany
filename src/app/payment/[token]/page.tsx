"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "@/components/Logo";

interface PaymentInfo {
  requestId: number;
  service: string;
  company: string | null;
  clientName: string;
  clientAmount: number | null;
  status: string;
  executorName: string;
}

type PageState = "loading" | "ready" | "already_paid" | "confirming" | "success" | "error";

export default function PaymentPage() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<PageState>("loading");
  const [info, setInfo] = useState<PaymentInfo | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchInfo = useCallback(async () => {
    try {
      const res = await fetch(`/api/payment/${token}`);
      if (!res.ok) {
        setState("error");
        setErrorMsg("Страница не найдена");
        return;
      }
      const data: PaymentInfo = await res.json();
      setInfo(data);
      if (data.status === "sent_to_client") {
        setState("ready");
      } else {
        setState("already_paid");
      }
    } catch {
      setState("error");
      setErrorMsg("Ошибка загрузки данных");
    }
  }, [token]);

  useEffect(() => {
    fetchInfo();
  }, [fetchInfo]);

  const handleConfirm = async () => {
    setState("confirming");
    try {
      const formData = new FormData();
      if (file) {
        formData.append("file", file);
      }
      const res = await fetch(`/api/payment/${token}`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        setState("ready");
        setErrorMsg(data.error || "Ошибка при подтверждении");
        return;
      }
      setState("success");
    } catch {
      setState("ready");
      setErrorMsg("Ошибка соединения");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const formatAmount = (amount: number | null) => {
    if (amount == null) return "—";
    return amount.toLocaleString("ru-RU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " ₽";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {state === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <div className="w-12 h-12 border-4 border-orange-300 border-t-orange-600 rounded-full animate-spin mx-auto" />
            <p className="mt-4 text-gray-500">Загрузка...</p>
          </motion.div>
        )}

        {state === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full text-center"
          >
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Страница не найдена</h2>
            <p className="text-gray-500">{errorMsg}</p>
          </motion.div>
        )}

        {state === "already_paid" && info && (
          <motion.div
            key="already_paid"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full text-center"
          >
            <div className="flex justify-center mb-6">
              <Logo />
            </div>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Оплата уже подтверждена</h2>
            <p className="text-gray-500">
              Заявка №{info.requestId} — {info.service}
            </p>
          </motion.div>
        )}

        {(state === "ready" || state === "confirming") && info && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-white/20 rounded-xl p-2">
                  <Logo />
                </div>
                <div>
                  <h1 className="text-lg font-bold">ЦСМ</h1>
                  <p className="text-white/80 text-sm">Центр сертификации и метрологии</p>
                </div>
              </div>
              <p className="text-white/90 text-sm">Подтверждение оплаты</p>
            </div>

            {/* Content */}
            <div className="p-8">
              {/* Request info */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Заявка</span>
                  <span className="font-medium text-gray-800">№{info.requestId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Услуга</span>
                  <span className="font-medium text-gray-800">{info.service}</span>
                </div>
                {(info.company || info.clientName) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Заказчик</span>
                    <span className="font-medium text-gray-800">
                      {info.company || info.clientName}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Исполнитель</span>
                  <span className="font-medium text-gray-800">{info.executorName}</span>
                </div>
              </div>

              {/* Amount */}
              <div className="bg-orange-50 rounded-xl p-6 text-center mb-6 border border-orange-100">
                <p className="text-sm text-gray-500 mb-1">Сумма к оплате</p>
                <p className="text-3xl font-bold text-orange-600">
                  {formatAmount(info.clientAmount)}
                </p>
              </div>

              {/* Error message */}
              <AnimatePresence>
                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center"
                  >
                    {errorMsg}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* File upload area */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Подтверждение оплаты (необязательно)
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`
                    border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
                    transition-colors duration-200
                    ${dragOver
                      ? "border-orange-400 bg-orange-50"
                      : file
                        ? "border-green-300 bg-green-50"
                        : "border-gray-200 hover:border-orange-300 hover:bg-orange-50/50"
                    }
                  `}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setFile(f);
                    }}
                  />
                  {file ? (
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-gray-700">{file.name}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <>
                      <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                      <p className="text-sm text-gray-500">
                        Перетащите файл или{" "}
                        <span className="text-orange-500 font-medium">выберите</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-1">PDF, JPEG, PNG, WebP до 10 МБ</p>
                    </>
                  )}
                </div>
              </div>

              {/* Confirm button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleConfirm}
                disabled={state === "confirming"}
                className={`
                  w-full py-4 rounded-xl text-white font-semibold text-lg
                  transition-shadow
                  ${state === "confirming"
                    ? "bg-orange-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-orange-500 to-amber-500 hover:shadow-lg hover:shadow-orange-200"
                  }
                `}
              >
                {state === "confirming" ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Отправка...
                  </span>
                ) : (
                  "Подтвердить оплату"
                )}
              </motion.button>

              <p className="text-xs text-gray-400 text-center mt-4">
                Нажимая кнопку, вы подтверждаете факт оплаты
              </p>
            </div>
          </motion.div>
        )}

        {state === "success" && info && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full text-center"
          >
            <div className="flex justify-center mb-6">
              <Logo />
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2, stiffness: 200 }}
              className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Оплата подтверждена</h2>
            <p className="text-gray-500 mb-2">
              Заявка №{info.requestId} — {info.service}
            </p>
            <p className="text-gray-400 text-sm">
              Спасибо! Мы свяжемся с вами после проверки.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
