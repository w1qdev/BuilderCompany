"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAdminAuth } from "@/lib/AdminAuthContext";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface Service {
  id: number;
  title: string;
  description: string;
  price: number;
  image: string | null;
  category: string;
  isActive: boolean;
}

const categories = [
  { id: "1", label: "Аттестация испытательного оборудования" },
  { id: "2", label: "Поверка измерителей электрических величин" },
  { id: "3", label: "Поверка систем испытательных" },
  { id: "4", label: "Поверка средств измерений" },
  { id: "5", label: "Калибровка средств измерений" },
];

export default function AdminServicesPage() {
  const { password } = useAdminAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    image: "",
    category: "1",
    isActive: true,
  });

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/services?limit=100", {
        headers: { "x-admin-password": password },
      });
      if (res.ok) {
        const data = await res.json();
        setServices(data.services);
      }
    } catch {
      toast.error("Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, [password]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingService
      ? `/api/admin/services/${editingService.id}`
      : "/api/admin/services";
    const method = editingService ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingService ? "Услуга обновлена" : "Услуга создана");
        fetchServices();
        resetForm();
      } else {
        toast.error("Ошибка сохранения");
      }
    } catch {
      toast.error("Ошибка");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Удалить услугу?")) return;

    try {
      const res = await fetch(`/api/admin/services/${id}`, {
        method: "DELETE",
        headers: { "x-admin-password": password },
      });

      if (res.ok) {
        toast.success("Услуга удалена");
        fetchServices();
      }
    } catch {
      toast.error("Ошибка удаления");
    }
  };

  const editService = (service: Service) => {
    setEditingService(service);
    setFormData({
      title: service.title,
      description: service.description,
      price: service.price.toString(),
      image: service.image || "",
      category: service.category,
      isActive: service.isActive,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      price: "",
      image: "",
      category: "1",
      isActive: true,
    });
    setEditingService(null);
    setShowForm(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-dark">Управление услугами</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-white text-dark px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 border border-gray-200 transition-colors"
        >
          {showForm ? "Отмена" : "+ Добавить услугу"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 mb-6 shadow-lg">
          <h2 className="text-xl font-bold mb-4">
            {editingService ? "Редактировать услугу" : "Новая услуга"}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Название *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Цена (руб) *</Label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>
            <div className="md:col-span-2">
              <Label>Описание *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                required
              />
            </div>
            <div>
              <Label>Категория *</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>URL изображения</Label>
              <Input
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="md:col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                id="isActive"
              />
              <Label htmlFor="isActive">Активна (отображать на сайте)</Label>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="bg-primary text-white px-6 py-2 rounded-xl font-semibold hover:bg-primary-dark transition-colors">
              {editingService ? "Сохранить" : "Создать"}
            </button>
            {editingService && (
              <button type="button" onClick={resetForm} className="bg-gray-200 px-6 py-2 rounded-xl font-semibold">
                Отмена
              </button>
            )}
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-bold">Всего услуг: {services.length}</h3>
        </div>
        {loading ? (
          <div className="p-20 text-center">Загрузка...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-warm-bg">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Название</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Категория</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Цена</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Статус</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Действия</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.id} className="border-t hover:bg-warm-bg/50">
                    <td className="px-4 py-3 text-sm">{service.id}</td>
                    <td className="px-4 py-3 text-sm font-medium">{service.title}</td>
                    <td className="px-4 py-3 text-sm">
                      {categories.find((c) => c.id === service.category)?.label || service.category}
                    </td>
                    <td className="px-4 py-3 text-sm">{service.price.toLocaleString()} ₽</td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          service.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {service.isActive ? "Активна" : "Неактивна"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => editService(service)}
                        className="text-blue-600 hover:underline mr-3"
                      >
                        Редактировать
                      </button>
                      <button onClick={() => handleDelete(service.id)} className="text-red-600 hover:underline">
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
