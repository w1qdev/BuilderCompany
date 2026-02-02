"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const services = [
  "Строительство дома",
  "Коммерческое строительство",
  "Капитальный ремонт",
  "Косметический ремонт",
  "Проектирование",
  "Дизайн интерьера",
  "Кровельные работы",
  "Отделка фасада",
  "Другое",
];

interface ContactFormProps {
  onSuccess?: () => void;
}

export default function ContactForm({ onSuccess }: ContactFormProps) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    service: services[0],
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Ошибка отправки");
      }

      setStatus("success");
      setForm({ name: "", phone: "", email: "", service: services[0], message: "" });

      setTimeout(() => {
        onSuccess?.();
        setStatus("idle");
      }, 2000);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Произошла ошибка");
    }
  };

  if (status === "success") {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h4 className="text-xl font-bold text-dark mb-2">Заявка отправлена!</h4>
        <p className="text-neutral text-sm">Мы свяжемся с вами в ближайшее время</p>
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
          onValueChange={(value) => setForm({ ...form, service: value })}
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
      <div className="space-y-1.5">
        <Label htmlFor="contact-message">Сообщение</Label>
        <Textarea
          id="contact-message"
          placeholder="Сообщение (необязательно)"
          rows={3}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="resize-none"
        />
      </div>

      {status === "error" && (
        <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">
          {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full gradient-primary text-white py-3.5 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === "loading" ? "Отправка..." : "Отправить заявку"}
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
