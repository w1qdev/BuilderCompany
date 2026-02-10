"use client";

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
const poverk = ["Первичная", "Периодическая"];

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

type FormType = {
  name: string;
  phone: string;
  email: string;
  object: string;
  fabricNumber: string;
  registry: string;
  service: string;
  poverk: string;
  message: string;
};

export default function ContactForm({
  onSuccess,
  initialValues,
}: ContactFormProps) {
  const maxAllowedFileSizeInBytes = 10 * 1024 * 1024;
  const [form, setForm] = useState<FormType>({
    name: initialValues?.name || "",
    phone: initialValues?.phone || "",
    email: initialValues?.email || "",
    object: initialValues?.object || "",
    fabricNumber: initialValues?.fabricNumber || "",
    registry: initialValues?.registry || "",
    service: services[0],
    poverk: poverk[0],
    message: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [, setUploadProgress] = useState<UploadProgress>(
    UploadProgressEnums.IDLE,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>(
    SubmitStatusEnums.IDLE,
  );
  const [errorMsg, setErrorMsg] = useState("");

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
        body: JSON.stringify({ ...form, fileName, filePath }),
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
        object: "",
        service: services[0],
        poverk: poverk[0],
        fabricNumber: "",
        registry: "",
        message: "",
      });
      setFile(null);
      setUploadProgress(UploadProgressEnums.IDLE);

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
      <div className="space-y-1.5">
        <Label htmlFor="contact-name">Ваше имя</Label>
        <Input
          id="contact-name"
          type="text"
          placeholder="Ваше имя *"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="contact-phone">Телефон</Label>
        <Input
          id="contact-phone"
          type="tel"
          placeholder="Телефон *"
          required
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="contact-email">Email</Label>
        <Input
          id="contact-email"
          type="email"
          placeholder="Email *"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Услуга</Label>
        <Select
          value={form.service}
          onValueChange={(value) => {
            setForm({ ...form, service: value });
          }}
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

      {form.service === services[0] && (
        <div className="space-y-1.5">
          <Label>Поверка</Label>
          <Select
            value={form.poverk}
            onValueChange={(value) => {
              setForm({ ...form, poverk: value });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Выберите тип поверки" />
            </SelectTrigger>
            <SelectContent>
              {poverk.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="object-type">
          Полное наименовение СИ или оборудования
        </Label>
        <Input
          id="object-type"
          type="text"
          placeholder=""
          value={form.object}
          onChange={(e) => setForm({ ...form, object: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="fabric-number">Заводской номер</Label>
        <Input
          id="object-type"
          type="text"
          placeholder="123"
          value={form.fabricNumber}
          onChange={(e) => setForm({ ...form, fabricNumber: e.target.value })}
        />
      </div>

      {form.service === services[0] && (
        <div className="space-y-1.5">
          <Label htmlFor="object-type">
            Номер реестра (обязательно при поверке)
          </Label>
          <Input
            id="registry"
            type="text"
            placeholder="12345-12"
            required
            value={form.registry}
            onChange={(e) => setForm({ ...form, registry: e.target.value })}
          />
        </div>
      )}

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
