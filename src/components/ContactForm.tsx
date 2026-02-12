"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRef, useState } from "react";

const services = ["Поверка СИ", "Калибровка", "Аттестация", "Другое"];
const poverkOptions = ["Первичная", "Периодическая"];

const ALLOWED_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
];

interface ContactFormProps {
  onSuccess?: () => void;
  initialValues?: {
    name?: string;
    phone?: string;
    email?: string;
    object?: string;
    fabricNumber?: string;
    registry?: string;
  };
}

enum UploadProgressEnums {
  IDLE = "idle",
  UPLOADING = "uploading",
  DONE = "done",
  ERROR = "error",
}

enum SubmitStatusEnums {
  IDLE = "idle",
  LOADING = "loading",
  SUCCESS = "success",
  ERROR = "error",
}

type UploadProgress =
  | UploadProgressEnums.IDLE
  | UploadProgressEnums.UPLOADING
  | UploadProgressEnums.DONE
  | UploadProgressEnums.ERROR;

type SubmitStatus =
  | SubmitStatusEnums.IDLE
  | SubmitStatusEnums.LOADING
  | SubmitStatusEnums.SUCCESS
  | SubmitStatusEnums.ERROR;

type FormFields = {
  name: string;
  phone: string;
  email: string;
  company: string;
  inn: string;
  message: string;
};

type ServiceItem = {
  id: string;
  service: string;
  poverk: string;
  object: string;
  fabricNumber: string;
  registry: string;
};

function createServiceItem(initial?: Partial<ServiceItem>): ServiceItem {
  return {
    id: crypto.randomUUID(),
    service: initial?.service || services[0],
    poverk: initial?.poverk || poverkOptions[0],
    object: initial?.object || "",
    fabricNumber: initial?.fabricNumber || "",
    registry: initial?.registry || "",
  };
}

export default function ContactForm({
  onSuccess,
  initialValues,
}: ContactFormProps) {
  const maxAllowedFileSizeInBytes = 10 * 1024 * 1024;
  const [form, setForm] = useState<FormFields>({
    name: initialValues?.name || "",
    phone: initialValues?.phone || "",
    email: initialValues?.email || "",
    company: "",
    inn: "",
    message: "",
  });
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([
    createServiceItem({
      object: initialValues?.object,
      fabricNumber: initialValues?.fabricNumber,
      registry: initialValues?.registry,
    }),
  ]);
  const [file, setFile] = useState<File | null>(null);
  const [, setUploadProgress] = useState<UploadProgress>(
    UploadProgressEnums.IDLE,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>(
    SubmitStatusEnums.IDLE,
  );
  const [errorMsg, setErrorMsg] = useState("");
  const [needContract, setNeedContract] = useState(false);

  const updateItem = (id: string, updates: Partial<ServiceItem>) => {
    setServiceItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    );
  };

  const addItem = () => {
    setServiceItems((prev) => [...prev, createServiceItem()]);
  };

  const removeItem = (id: string) => {
    if (serviceItems.length <= 1) return;
    setServiceItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const ext = "." + selectedFile.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setErrorMsg("Недопустимый тип файла. Разрешены: PDF, Word, JPEG, PNG");
      return;
    }

    if (selectedFile.size > maxAllowedFileSizeInBytes) {
      setErrorMsg("Размер файла превышает 10 МБ");
      return;
    }

    setFile(selectedFile);
    setErrorMsg("");
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus(SubmitStatusEnums.LOADING);
    setErrorMsg("");

    // Validate registry for Поверка СИ items
    for (let i = 0; i < serviceItems.length; i++) {
      if (serviceItems[i].service === "Поверка СИ" && !serviceItems[i].registry.trim()) {
        setSubmitStatus(SubmitStatusEnums.ERROR);
        setErrorMsg(`Позиция ${i + 1}: номер реестра обязателен для поверки СИ`);
        return;
      }
    }

    try {
      let fileName: string | undefined;
      let filePath: string | undefined;

      // Upload file first if selected
      if (file) {
        setUploadProgress(UploadProgressEnums.UPLOADING);
        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const data = await uploadRes.json();
          throw new Error(data.error || "Ошибка загрузки файла");
        }

        const uploadData = await uploadRes.json();
        fileName = uploadData.fileName;
        filePath = uploadData.filePath;
        setUploadProgress(UploadProgressEnums.DONE);
      }

      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          items: serviceItems.map(({ service, poverk, object, fabricNumber, registry }) => ({
            service,
            poverk: service === "Поверка СИ" ? poverk : undefined,
            object,
            fabricNumber,
            registry: service === "Поверка СИ" ? registry : undefined,
          })),
          fileName,
          filePath,
          needContract,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Ошибка отправки");
      }

      setSubmitStatus(SubmitStatusEnums.SUCCESS);
      setForm({
        name: "",
        phone: "",
        email: "",
        company: "",
        inn: "",
        message: "",
      });
      setServiceItems([createServiceItem()]);
      setFile(null);
      setUploadProgress(UploadProgressEnums.IDLE);
      setNeedContract(false);

      setTimeout(() => {
        onSuccess?.();
        setSubmitStatus(SubmitStatusEnums.IDLE);
      }, 2000);
    } catch (err) {
      setSubmitStatus(SubmitStatusEnums.ERROR);
      setUploadProgress(UploadProgressEnums.ERROR);
      setErrorMsg(err instanceof Error ? err.message : "Произошла ошибка");
    }
  };

  if (submitStatus === "success") {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h4 className="text-xl font-bold text-dark dark:text-white mb-2">
          Заявка отправлена!
        </h4>
        <p className="text-neutral dark:text-white/60 text-sm">
          Мы свяжемся с вами в ближайшее время
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="contact-name">Ваше имя <span className="text-red-500">*</span></Label>
          <Input
            id="contact-name"
            type="text"
            placeholder="Иванов Иван"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact-phone">Телефон <span className="text-red-500">*</span></Label>
          <Input
            id="contact-phone"
            type="tel"
            placeholder="+7 (___) ___-__-__"
            required
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact-email">Email <span className="text-red-500">*</span></Label>
          <Input
            id="contact-email"
            type="email"
            placeholder="email@example.com"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="contact-company">Наименование организации</Label>
          <Input
            id="contact-company"
            type="text"
            placeholder="ООО «Название компании»"
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact-inn">ИНН</Label>
          <Input
            id="contact-inn"
            type="text"
            placeholder="1234567890"
            maxLength={12}
            value={form.inn}
            onChange={(e) => setForm({ ...form, inn: e.target.value.replace(/\D/g, "") })}
          />
        </div>
      </div>

      {/* Service Items */}
      <div className="space-y-3">
        {serviceItems.map((item, index) => (
          <div
            key={item.id}
            className="relative border border-gray-200 dark:border-white/10 rounded-xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-dark dark:text-white">
                Позиция {index + 1}
              </span>
              {serviceItems.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  title="Удалить позицию"
                >
                  <svg
                    className="w-5 h-5"
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
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Услуга <span className="text-red-500">*</span></Label>
                <Select
                  value={item.service}
                  onValueChange={(value) => updateItem(item.id, { service: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите услугу" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {item.service === "Поверка СИ" && (
                <div className="space-y-1.5">
                  <Label>Поверка</Label>
                  <Select
                    value={item.poverk}
                    onValueChange={(value) => updateItem(item.id, { poverk: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите тип поверки" />
                    </SelectTrigger>
                    <SelectContent>
                      {poverkOptions.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Полное наименовение СИ или оборудования</Label>
              <Input
                type="text"
                placeholder=""
                value={item.object}
                onChange={(e) => updateItem(item.id, { object: e.target.value })}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Заводской номер</Label>
                <Input
                  type="text"
                  placeholder="123"
                  value={item.fabricNumber}
                  onChange={(e) => updateItem(item.id, { fabricNumber: e.target.value })}
                />
              </div>

              {item.service === "Поверка СИ" && (
                <div className="space-y-1.5">
                  <Label>Номер реестра <span className="text-red-500">*</span></Label>
                  <Input
                    type="text"
                    placeholder="12345-12"
                    required
                    value={item.registry}
                    onChange={(e) => updateItem(item.id, { registry: e.target.value })}
                  />
                </div>
              )}
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addItem}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-200 dark:border-white/20 rounded-xl text-sm text-neutral dark:text-white/60 hover:border-primary hover:text-primary transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Добавить позицию
        </button>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contact-message">Комментарии</Label>
        <Textarea
          id="contact-message"
          placeholder="Сообщение (необязательно)"
          rows={3}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="resize-none"
        />
      </div>

      {/* File Upload */}
      <div className="space-y-1.5">
        <Label>Реквизиты компании</Label>
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          {!file ? (
            <label
              htmlFor="file-upload"
              className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 dark:border-white/20 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span className="text-sm text-gray-500 dark:text-white/60">
                Прикрепить файл (PDF, Word, фото)
              </span>
            </label>
          ) : (
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-white/5 rounded-xl">
              <div className="flex items-center gap-2 min-w-0">
                <svg
                  className="w-5 h-5 text-primary shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="text-sm text-dark dark:text-white truncate">
                  {file.name}
                </span>
                <span className="text-xs text-gray-400 shrink-0">
                  ({(file.size / 1024 / 1024).toFixed(2)} МБ)
                </span>
              </div>
              <button
                type="button"
                onClick={removeFile}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              >
                <svg
                  className="w-5 h-5"
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
            </div>
          )}
        </div>
        <p className="text-xs text-gray-400">
          Макс. размер: 10 МБ. Форматы: PDF, DOC, DOCX, JPG, PNG
        </p>
      </div>

      {submitStatus === "error" && (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-xl px-4 py-3">
          {errorMsg}
        </div>
      )}

      <div className="flex items-start gap-3 p-4 bg-warm-bg dark:bg-neutral-900 rounded-xl">
        <Checkbox
          id="needContract"
          checked={needContract}
          onCheckedChange={(checked) => setNeedContract(checked === true)}
          className="mt-0.5"
        />
        <Label
          htmlFor="needContract"
          className="text-sm text-dark dark:text-white cursor-pointer select-none leading-relaxed"
        >
          Требуется оформление договора оказания услуг
        </Label>
      </div>

      <button
        type="submit"
        disabled={submitStatus === "loading"}
        className="w-full gradient-primary text-white py-3.5 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {submitStatus === "loading" ? "Отправка..." : "Отправить заявку"}
      </button>

      <p className="text-xs text-neutral-light text-center">
        Нажимая кнопку, вы соглашаетесь с{" "}
        <a href="/privacy" className="text-primary hover:underline">
          политикой конфиденциальности
        </a>
      </p>
    </form>
  );
}
