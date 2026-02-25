"use client";

// ARSHIN_ENABLED: set to true when Arshin integration is ready
const ARSHIN_ENABLED = false;

import { EmptyState } from "@/components/ui/empty-state";
import { Portal } from "@/components/ui/Portal";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { statusConfig as _statusConfig } from "@/lib/equipmentStatus";

const statusConfig: Record<string, { label: string; color: string }> = _statusConfig;

interface Equipment {
  id: number;
  name: string;
  type: string | null;
  serialNumber: string | null;
  registryNumber: string | null;
  verificationDate: string | null;
  nextVerification: string | null;
  interval: number;
  category: string;
  status: string;
  company: string | null;
  contactEmail: string | null;
  notes: string | null;
  arshinMismatch: boolean;
  arshinValidDate: string | null;
  arshinUrl: string | null;
  mitApproved: boolean | null;
  mitUrl: string | null;
  ignored: boolean;
  pinned: boolean;
  requestItems?: { id: number; request: { id: number; status: string; createdAt: string } }[];
}

interface VerificationRecord {
  id: number;
  date: string;
  nextDate: string | null;
  result: string | null;
  performer: string | null;
  certificate: string | null;
  notes: string | null;
  createdAt: string;
}

interface ArshinItem {
  miFullNumber: string;
  miName: string;
  miType: string;
  miManufacturer: string;
  miSerialNumber: string;
  miRegestryNumber: string;
  validDate: string;
  vriDate: string;
  arshinUrl: string;
  orgTitle?: string;
}

const categoryLabels: Record<string, string> = {
  verification: "Поверка",
  calibration: "Калибровка",
  attestation: "Аттестация",
};


interface EquipmentListProps {
  title: string;
  categories: string[];
  categoryOptions: { value: string; label: string }[];
  defaultCategory: string;
  dateLabel?: string;
  nextDateLabel?: string;
  highlightId?: number;
}

export default function EquipmentList({
  title,
  categories,
  categoryOptions,
  defaultCategory,
  dateLabel = "Дата последней поверки",
  nextDateLabel = "Дата следующей поверки",
  highlightId,
}: EquipmentListProps) {
  const emptyForm = {
    name: "",
    type: "",
    serialNumber: "",
    registryNumber: "",
    verificationDate: "",
    nextVerification: "",
    interval: 12,
    category: defaultCategory,
    company: "",
    contactEmail: "",
    notes: "",
    arshinUrl: "",
  };

  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const highlightRef = useRef<HTMLDivElement | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showIgnored, setShowIgnored] = useState(false);
  const [filterCategory, setFilterCategory] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 50;
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [arshinLoading, setArshinLoading] = useState(false);
  const [arshinResults, setArshinResults] = useState<ArshinItem[] | null>(null);
  const [arshinChecking, setArshinChecking] = useState(false);
  // Org import state
  const [showOrgImport, setShowOrgImport] = useState(false);
  const [orgQuery, setOrgQuery] = useState("");
  const [orgSearching, setOrgSearching] = useState(false);
  const [orgResults, setOrgResults] = useState<ArshinItem[] | null>(null);
  const [orgSelected, setOrgSelected] = useState<Set<number>>(new Set());
  const [orgImporting, setOrgImporting] = useState(false);
  const [orgSuggestions, setOrgSuggestions] = useState<string[]>([]);
  const [orgSuggestLoading, setOrgSuggestLoading] = useState(false);
  const [orgSuggestOpen, setOrgSuggestOpen] = useState(false);
  const orgSuggestTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  // MIT (тип СИ в реестре допущенных) — автоматически при показе VRI-результатов
  // Хранит статус для каждого miRegestryNumber: 'loading' | 'approved' | 'not_found'
  const [mitStatusMap, setMitStatusMap] = useState<Record<string, { status: "loading" | "approved" | "not_found"; mitUrl?: string }>>({});
  // Request confirmation state
  const [showRequestConfirm, setShowRequestConfirm] = useState(false);
  const [requestArshinInfo, setRequestArshinInfo] = useState<{ id: number; name: string; validDate: string | null; expired: boolean }[]>([]);
  const [requestArshinLoading, setRequestArshinLoading] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  // Delete confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Drag & drop
  const [dragOver, setDragOver] = useState(false);
  // Comparison
  const [compareMode, setCompareMode] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  // Verification history
  const [historyEquipmentId, setHistoryEquipmentId] = useState<number | null>(null);
  const [historyEquipmentName, setHistoryEquipmentName] = useState("");
  const [historyRecords, setHistoryRecords] = useState<VerificationRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Background Arshin check — runs after equipment loads, silently
  const runArshinCheck = async () => {
    setArshinChecking(true);
    try {
      await fetch("/api/equipment/arshin-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      // Reload equipment to get updated arshinMismatch/arshinUrl/status
      await fetchEquipmentSilent();
    } catch {
      // ignore background errors
    } finally {
      setArshinChecking(false);
    }
  };

  const buildEquipmentParams = (overridePage?: number) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (showIgnored) params.set("ignored", "true");
    if (filterStatus) params.set("status", filterStatus);
    if (filterCategory) {
      params.set("category", filterCategory);
    } else {
      categories.forEach((c) => params.append("category", c));
    }
    params.set("page", String(overridePage ?? page));
    params.set("limit", String(PAGE_SIZE));
    return params;
  };

  const fetchEquipmentSilent = async () => {
    try {
      const res = await fetch(`/api/equipment?${buildEquipmentParams()}`);
      if (res.ok) {
        const data = await res.json();
        setEquipment(data.equipment || []);
        setTotal(data.total ?? 0);
      }
    } catch { /* ignore */ }
  };

  const fetchEquipment = async (targetPage = page) => {
    try {
      const res = await fetch(`/api/equipment?${buildEquipmentParams(targetPage)}`);
      if (res.ok) {
        const data = await res.json();
        setEquipment(data.equipment || []);
        setTotal(data.total ?? 0);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchEquipment(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterStatus, filterCategory, showIgnored]);

  useEffect(() => {
    if (!loading) fetchEquipment(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // ARSHIN_ENABLED: auto-checks disabled until integration is ready
  // useEffect(() => { ... run Arshin check at most once per 24 hours ... }, [loading]);
  // useEffect(() => { ... check new items without MIT/Arshin status ... }, [loading]);

  // Scroll to highlighted item after load
  useEffect(() => {
    if (!loading && highlightId && highlightRef.current) {
      setTimeout(() => {
        highlightRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  }, [loading, highlightId]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Введите наименование оборудования");
      return;
    }
    setSaving(true);
    try {
      const url = editingId ? `/api/equipment/${editingId}` : "/api/equipment";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        toast.success(
          editingId ? "Оборудование обновлено" : "Оборудование добавлено",
        );
        setShowForm(false);
        setEditingId(null);
        setForm(emptyForm);
        setArshinResults(null);
        setMitStatusMap({});
        fetchEquipment();
      } else {
        const data = await res.json();
        toast.error(data.error || "Ошибка");
      }
    } catch {
      toast.error("Ошибка сети");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (eq: Equipment) => {
    setEditingId(eq.id);
    setForm({
      name: eq.name,
      type: eq.type || "",
      serialNumber: eq.serialNumber || "",
      registryNumber: eq.registryNumber || "",
      verificationDate: eq.verificationDate
        ? eq.verificationDate.split("T")[0]
        : "",
      nextVerification: eq.nextVerification
        ? eq.nextVerification.split("T")[0]
        : "",
      interval: eq.interval,
      category: eq.category,
      company: eq.company || "",
      contactEmail: eq.contactEmail || "",
      notes: eq.notes || "",
      arshinUrl: eq.arshinUrl || "",
    });
    setShowForm(true);
  };

  const handleDelete = (id: number, name: string) => {
    setDeleteConfirmId(id);
    setDeleteConfirmName(name);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/equipment/${deleteConfirmId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Оборудование удалено");
        setSelected((prev) => {
          const next = new Set(prev);
          next.delete(deleteConfirmId);
          return next;
        });
        fetchEquipment();
      } else {
        toast.error("Ошибка удаления");
      }
    } catch {
      toast.error("Ошибка удаления");
    } finally {
      setDeleting(false);
      setDeleteConfirmId(null);
      setDeleteConfirmName("");
    }
  };

  const handleDuplicate = (eq: Equipment) => {
    setEditingId(null);
    setForm({
      name: eq.name + " (копия)",
      type: eq.type || "",
      serialNumber: "",
      registryNumber: "",
      verificationDate: "",
      nextVerification: "",
      interval: eq.interval,
      category: eq.category,
      company: eq.company || "",
      contactEmail: eq.contactEmail || "",
      notes: eq.notes || "",
      arshinUrl: "",
    });
    setShowForm(true);
  };

  const handleIgnore = async (id: number, ignore: boolean) => {
    try {
      const res = await fetch(`/api/equipment/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ignored: ignore }),
      });
      if (res.ok) {
        toast.success(ignore ? "Перемещено в архив" : "Восстановлено из архива");
        fetchEquipment();
      } else {
        toast.error("Ошибка");
      }
    } catch {
      toast.error("Ошибка сети");
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", defaultCategory);
      const res = await fetch("/api/equipment/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        const msg = [`Импортировано: ${data.imported}`];
        if (data.skipped > 0) msg.push(`пропущено: ${data.skipped}`);
        toast.success(msg.join(", "));
        if (data.errors?.length > 0) {
          data.errors.slice(0, 3).forEach((err: string) => toast.warning(err));
        }
        fetchEquipment();
      } else {
        toast.error(data.error || "Ошибка импорта");
      }
    } catch {
      toast.error("Ошибка импорта");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await fetch("/api/equipment/import");
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Шаблон_импорта.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Ошибка загрузки шаблона");
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      categories.forEach((c) => params.append("category", c));
      const res = await fetch(`/api/equipment/export?${params}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title}_${new Date().toISOString().split("T")[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Файл скачан");
    } catch {
      toast.error("Ошибка экспорта");
    }
  };


  // Автоматически проверяет MIT-статус для списка VRI-результатов
  const autoCheckMit = (items: ArshinItem[]) => {
    const registryNumbers = [...new Set(items.map((i) => i.miRegestryNumber).filter(Boolean))];
    if (registryNumbers.length === 0) return;

    // Инициализируем статусы как loading
    setMitStatusMap((prev) => {
      const next = { ...prev };
      for (const rn of registryNumbers) {
        if (!next[rn]) next[rn] = { status: "loading" };
      }
      return next;
    });

    // Проверяем каждый уникальный номер реестра
    for (const regNum of registryNumbers) {
      fetch(`/api/arshin/mit?q=${encodeURIComponent(regNum)}`)
        .then((r) => r.json())
        .then((data) => {
          const approved = Array.isArray(data.items) && data.items.length > 0;
          const mitUrl = approved ? data.items[0].mitUrl : undefined;
          setMitStatusMap((prev) => ({
            ...prev,
            [regNum]: { status: approved ? "approved" : "not_found", mitUrl },
          }));
        })
        .catch(() => {
          setMitStatusMap((prev) => ({ ...prev, [regNum]: { status: "not_found" } }));
        });
    }
  };

  const searchArshin = async () => {
    const q = form.registryNumber.trim() || form.serialNumber.trim();
    if (!q) {
      toast.error("Введите номер реестра или серийный номер");
      return;
    }
    setArshinLoading(true);
    setArshinResults(null);
    try {
      const res = await fetch(`/api/arshin?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Ошибка запроса к Аршин");
        return;
      }
      if (data.items.length === 0) {
        toast.info("Ничего не найдено в ФГИС Аршин");
        return;
      }
      setArshinResults(data.items);
      // Auto-check MIT status for each VRI result
      autoCheckMit(data.items);
    } catch {
      toast.error("Ошибка запроса к ФГИС Аршин");
    } finally {
      setArshinLoading(false);
    }
  };

  const applyArshinResult = (item: ArshinItem) => {
    // Calculate interval in months between verification date and valid date
    let interval = 12;
    if (item.vriDate && item.validDate) {
      const from = new Date(item.vriDate);
      const to = new Date(item.validDate);
      const months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
      if (months > 0) interval = months;
    }

    const noteParts = [
      item.miManufacturer && `Производитель: ${item.miManufacturer}`,
      item.orgTitle && `Поверитель: ${item.orgTitle}`,
      "Импортировано из ФГИС Аршин",
    ].filter(Boolean);

    setForm((prev) => ({
      ...prev,
      name: item.miName || prev.name,
      type: item.miType || prev.type,
      serialNumber: item.miSerialNumber || prev.serialNumber,
      registryNumber: item.miRegestryNumber || prev.registryNumber,
      verificationDate: item.vriDate ? item.vriDate.split("T")[0] : prev.verificationDate,
      nextVerification: item.validDate ? item.validDate.split("T")[0] : prev.nextVerification,
      interval,
      company: item.orgTitle || prev.company,
      notes: noteParts.join("\n") || prev.notes,
      arshinUrl: item.arshinUrl || (prev as typeof prev & { arshinUrl?: string }).arshinUrl || "",
    }));
    setArshinResults(null);
    toast.success("Данные из Аршин применены");
  };

  // --- Org import ---
  const fetchOrgSuggestions = (value: string) => {
    if (orgSuggestTimeout.current) clearTimeout(orgSuggestTimeout.current);
    if (value.length < 3) { setOrgSuggestions([]); setOrgSuggestOpen(false); return; }
    orgSuggestTimeout.current = setTimeout(async () => {
      setOrgSuggestLoading(true);
      try {
        const res = await fetch(`/api/arshin?q=${encodeURIComponent(value)}&suggest=1`);
        const data = await res.json();
        if (res.ok && data.suggestions?.length) {
          setOrgSuggestions(data.suggestions);
          setOrgSuggestOpen(true);
        } else {
          setOrgSuggestions([]);
          setOrgSuggestOpen(false);
        }
      } catch { /* ignore */ }
      finally { setOrgSuggestLoading(false); }
    }, 400);
  };

  const searchByOrg = async () => {
    if (!orgQuery.trim()) { toast.error("Введите название организации"); return; }
    setOrgSearching(true);
    setOrgResults(null);
    setOrgSelected(new Set());
    try {
      const res = await fetch(`/api/arshin?q=${encodeURIComponent(orgQuery.trim())}&org=1`);
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Ошибка"); return; }
      if (!data.items.length) { toast.info("Ничего не найдено"); return; }
      setOrgResults(data.items);
      // Select all by default
      setOrgSelected(new Set(data.items.map((_: ArshinItem, i: number) => i)));
    } catch { toast.error("Ошибка сети"); }
    finally { setOrgSearching(false); }
  };

  const importOrgSelected = async () => {
    if (orgSelected.size === 0) { toast.error("Выберите оборудование для импорта"); return; }
    setOrgImporting(true);
    const toImport = (orgResults || []).filter((_, i) => orgSelected.has(i));
    let imported = 0;
    for (const item of toImport) {
      try {
        let interval = 12;
        if (item.vriDate && item.validDate) {
          const from = new Date(item.vriDate);
          const to = new Date(item.validDate);
          const months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
          if (months > 0) interval = months;
        }
        const noteParts = [
          item.miManufacturer && `Производитель: ${item.miManufacturer}`,
          item.orgTitle && `Поверитель: ${item.orgTitle}`,
          "Импортировано из ФГИС Аршин",
        ].filter(Boolean);

        const res = await fetch("/api/equipment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: item.miName,
            type: item.miType,
            serialNumber: item.miSerialNumber,
            registryNumber: item.miRegestryNumber,
            verificationDate: item.vriDate ? item.vriDate.split("T")[0] : "",
            nextVerification: item.validDate ? item.validDate.split("T")[0] : "",
            interval,
            category: defaultCategory,
            company: item.orgTitle || "",
            notes: noteParts.join("\n"),
            arshinUrl: item.arshinUrl,
          }),
        });
        if (res.ok) imported++;
      } catch { /* skip */ }
    }
    toast.success(`Импортировано ${imported} ед. оборудования`);
    setShowOrgImport(false);
    setOrgResults(null);
    setOrgSelected(new Set());
    fetchEquipment();
    setOrgImporting(false);
  };

  // --- Request with Arshin confirmation ---
  const handleCreateRequest = async () => {
    if (selected.size === 0) { toast.error("Выберите оборудование"); return; }
    // Check Arshin for selected items that have serial/registry
    const selectedEq = equipment.filter((e) => selected.has(e.id));
    const checkable = selectedEq.filter((e) => e.serialNumber || e.registryNumber);
    if (checkable.length === 0) {
      await submitRequest();
      return;
    }
    setRequestArshinLoading(true);
    setShowRequestConfirm(true);
    const info: typeof requestArshinInfo = [];
    for (const eq of selectedEq) {
      if (eq.arshinValidDate) {
        const expired = new Date(eq.arshinValidDate) < new Date();
        info.push({ id: eq.id, name: eq.name, validDate: eq.arshinValidDate, expired });
      } else {
        info.push({ id: eq.id, name: eq.name, validDate: null, expired: false });
      }
    }
    setRequestArshinInfo(info);
    setRequestArshinLoading(false);
  };

  const submitRequest = async () => {
    setSubmittingRequest(true);
    try {
      const res = await fetch("/api/equipment/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ equipmentIds: Array.from(selected) }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowRequestConfirm(false);
        setSelected(new Set());
        toast.success(`Заявка №${data.requestId} успешно создана`);
      } else {
        toast.error(data.error || "Ошибка");
      }
    } catch {
      toast.error("Ошибка создания заявки");
    } finally {
      setSubmittingRequest(false);
    }
  };

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === equipment.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(equipment.map((e) => e.id)));
    }
  };

  const handlePin = async (id: number, pin: boolean) => {
    try {
      const res = await fetch(`/api/equipment/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: pin }),
      });
      if (res.ok) {
        toast.success(pin ? "Закреплено" : "Откреплено");
        setEquipment((prev) => prev.map((e) => e.id === id ? { ...e, pinned: pin } : e));
      }
    } catch {
      toast.error("Ошибка");
    }
  };

  const handleBulkAction = async (action: "delete" | "archive" | "unarchive") => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    try {
      const res = await fetch("/api/equipment/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ids }),
      });
      const data = await res.json();
      if (res.ok) {
        const labels = { delete: "Удалено", archive: "Архивировано", unarchive: "Восстановлено" };
        toast.success(`${labels[action]}: ${data.count}`);
        setSelected(new Set());
        fetchEquipment();
      } else {
        toast.error(data.error || "Ошибка");
      }
    } catch {
      toast.error("Ошибка сети");
    }
  };

  const handleDragDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext || "")) {
      toast.error("Поддерживаются только .xlsx, .xls, .csv файлы");
      return;
    }
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", defaultCategory);
      const res = await fetch("/api/equipment/import", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) {
        const msg = [`Импортировано: ${data.imported}`];
        if (data.skipped > 0) msg.push(`пропущено: ${data.skipped}`);
        toast.success(msg.join(", "));
        fetchEquipment();
      } else {
        toast.error(data.error || "Ошибка импорта");
      }
    } catch {
      toast.error("Ошибка импорта");
    } finally {
      setImporting(false);
    }
  };

  const openHistory = async (eq: Equipment) => {
    setHistoryEquipmentId(eq.id);
    setHistoryEquipmentName(eq.name);
    setHistoryLoading(true);
    setHistoryRecords([]);
    try {
      const res = await fetch(`/api/equipment/${eq.id}/history`);
      if (res.ok) {
        const data = await res.json();
        setHistoryRecords(data.records || []);
      }
    } catch { /* ignore */ }
    finally { setHistoryLoading(false); }
  };

  const compareItems = equipment.filter((e) => selected.has(e.id));

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDragDrop}
      className="relative"
    >
      {/* Drag & drop overlay */}
      {dragOver && (
        <div className="absolute inset-0 z-40 bg-primary/5 border-2 border-dashed border-primary rounded-2xl flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <svg className="w-12 h-12 text-primary mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm font-medium text-primary">Перетащите файл (.xlsx, .csv) для импорта</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-dark dark:text-white">
          {title}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setForm(emptyForm);
            }}
            className="inline-flex items-center gap-2 gradient-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-primary/30 transition-shadow"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Добавить
          </button>
          <label
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white dark:bg-dark-light text-dark dark:text-white border border-gray-200 dark:border-white/10 cursor-pointer hover:bg-gray-50 transition-colors ${importing ? "opacity-50 pointer-events-none" : ""}`}
          >
            <svg
              className="w-4 h-4"
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
            {importing ? "Импорт..." : "Импорт "}
            (.xlsx)
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleImport}
            />
          </label>
          <button
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-neutral dark:text-white/60 hover:text-dark dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            title="Скачать шаблон для импорта"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Шаблон
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white dark:bg-dark-light text-dark dark:text-white border border-gray-200 dark:border-white/10 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Экспорт (.xlsx)
          </button>
          {/* ARSHIN_ENABLED: org import button hidden until integration is ready */}
          {ARSHIN_ENABLED && (
            <button
              onClick={() => setShowOrgImport(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-400/30 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Аршин: по организации
            </button>
          )}
          {ARSHIN_ENABLED && arshinChecking && (
            <span className="inline-flex items-center gap-1.5 text-xs text-neutral dark:text-white/40">
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Проверка через Аршин...
            </span>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 sm:max-w-xs">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Поиск..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-light text-sm text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select
          value={showIgnored ? "ignored" : filterStatus}
          onChange={(e) => {
            if (e.target.value === "ignored") {
              setShowIgnored(true);
              setFilterStatus("");
            } else {
              setShowIgnored(false);
              setFilterStatus(e.target.value);
            }
          }}
          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-light text-sm text-dark dark:text-white"
        >
          <option value="">Все статусы</option>
          <option value="active">Активно</option>
          <option value="pending">Скоро поверка</option>
          <option value="expired">Просрочено</option>
          <option value="ignored">Архив</option>
        </select>
        {categoryOptions.length > 1 && (
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-light text-sm text-dark dark:text-white"
          >
            <option value="">Все категории</option>
            {categoryOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-primary/5 dark:bg-primary/10 rounded-xl border border-primary/20">
          <span className="text-sm font-medium text-dark dark:text-white">
            Выбрано: {selected.size}
          </span>
          <button
            onClick={handleCreateRequest}
            className="px-4 py-1.5 rounded-lg text-sm font-semibold gradient-primary text-white hover:shadow-md transition-shadow"
          >
            Создать заявку
          </button>
          {selected.size >= 2 && selected.size <= 5 && (
            <button
              onClick={() => setShowCompare(true)}
              className="px-4 py-1.5 rounded-lg text-sm font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-400/30 hover:bg-blue-100 transition-colors"
            >
              Сравнить ({selected.size})
            </button>
          )}
          <div className="w-px h-5 bg-gray-300 dark:bg-white/20" />
          <button
            onClick={() => handleBulkAction(showIgnored ? "unarchive" : "archive")}
            className="px-4 py-1.5 rounded-lg text-sm font-medium bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-400/30 hover:bg-yellow-100 transition-colors"
          >
            {showIgnored ? "Восстановить" : "В архив"}
          </button>
          <button
            onClick={() => {
              if (confirm(`Удалить ${selected.size} записей?`)) {
                handleBulkAction("delete");
              }
            }}
            className="px-4 py-1.5 rounded-lg text-sm font-medium bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-400/30 hover:bg-red-100 transition-colors"
          >
            Удалить
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="px-3 py-1.5 rounded-lg text-sm text-neutral hover:bg-gray-100 dark:hover:bg-white/5 transition-colors ml-auto"
          >
            Сбросить
          </button>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <Portal>
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-white dark:bg-dark-light rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-dark dark:text-white mb-4">
              {editingId
                ? "Редактировать оборудование"
                : "Добавить оборудование"}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral mb-1">
                  Наименование *
                </label>
                <input
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Манометр МП-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral mb-1">
                    Тип/Модель
                  </label>
                  <input
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral mb-1">
                    Категория
                  </label>
                  <select
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm"
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                  >
                    {categoryOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral mb-1">
                    Заводской номер
                  </label>
                  <input
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm"
                    value={form.serialNumber}
                    onChange={(e) =>
                      setForm({ ...form, serialNumber: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral mb-1">
                    Номер реестра ФГИС
                  </label>
                  <input
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm"
                    value={form.registryNumber}
                    placeholder="Номер из реестра СИ"
                    onChange={(e) =>
                      setForm({ ...form, registryNumber: e.target.value })
                    }
                  />
                </div>
              </div>
              {/* ARSHIN_ENABLED: Аршин search hidden until integration is ready */}
              {ARSHIN_ENABLED && <div>
                <button
                  type="button"
                  onClick={searchArshin}
                  disabled={arshinLoading}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-400/30 text-blue-700 dark:text-blue-300 text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50"
                >
                  {arshinLoading ? (
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                  )}
                  {arshinLoading ? "Поиск в Аршин..." : "Найти в ФГИС Аршин по номеру реестра или заводскому номеру"}
                </button>
                {arshinResults && arshinResults.length > 0 && (
                  <div className="mt-2 border border-blue-200 dark:border-blue-400/30 rounded-lg overflow-hidden">
                    <div className="bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 flex justify-between items-center">
                      <span>Результаты из ФГИС Аршин — нажмите для применения</span>
                      <button type="button" onClick={() => setArshinResults(null)} className="text-blue-400 hover:text-blue-600">✕</button>
                    </div>
                    {arshinResults.map((item, i) => {
                      const mitStatus = item.miRegestryNumber ? mitStatusMap[item.miRegestryNumber] : undefined;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => applyArshinResult(item)}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/10 border-t border-blue-100 dark:border-blue-400/20 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-dark dark:text-white truncate">{item.miName || "—"}</div>
                              <div className="text-neutral dark:text-white/50 mt-0.5">
                                {[item.miType, item.miSerialNumber && `№ ${item.miSerialNumber}`, item.validDate && `до ${item.validDate.split("T")[0]}`].filter(Boolean).join(" · ")}
                              </div>
                              {item.orgTitle && (
                                <div className="text-neutral dark:text-white/40 mt-0.5 truncate">
                                  Поверитель: {item.orgTitle}
                                </div>
                              )}
                            </div>
                            {/* MIT badge */}
                            {mitStatus && (
                              <span className="shrink-0 mt-0.5">
                                {mitStatus.status === "loading" ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white/40">
                                    <svg className="w-2.5 h-2.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                    </svg>
                                    MIT...
                                  </span>
                                ) : mitStatus.status === "approved" ? (
                                  <a
                                    href={mitStatus.mitUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 transition-colors"
                                  >
                                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Допущен
                                  </a>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-white/40">
                                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Не найден
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral mb-1">
                    {dateLabel}
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm"
                    value={form.verificationDate}
                    onChange={(e) =>
                      setForm({ ...form, verificationDate: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral mb-1">
                    {nextDateLabel}
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm"
                    value={form.nextVerification}
                    onChange={(e) =>
                      setForm({ ...form, nextVerification: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral mb-1">
                    Интервал (мес.)
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm"
                    value={form.interval}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        interval: Number(e.target.value) || 12,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral mb-1">
                    Организация
                  </label>
                  <input
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm"
                    value={form.company}
                    onChange={(e) =>
                      setForm({ ...form, company: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral mb-1">
                  Email для уведомлений
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm"
                  value={form.contactEmail}
                  onChange={(e) =>
                    setForm({ ...form, contactEmail: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral mb-1">
                  Примечания
                </label>
                <textarea
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm resize-none"
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-neutral hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 rounded-xl text-sm font-semibold gradient-primary text-white hover:shadow-lg hover:shadow-primary/30 transition-shadow disabled:opacity-50"
              >
                {saving
                  ? "Сохранение..."
                  : editingId
                    ? "Сохранить"
                    : "Добавить"}
              </button>
            </div>
          </div>
        </div>
        </Portal>
      )}

      {/* Org import modal */}
      {showOrgImport && (
        <Portal>
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowOrgImport(false)}>
          <div className="bg-white dark:bg-dark-light rounded-2xl shadow-xl max-w-xl w-full flex flex-col max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
            {/* Fixed header — не скроллируется, дропдаун не обрезается */}
            <div className="p-6 pb-0 shrink-0">
              <h2 className="text-lg font-bold text-dark dark:text-white mb-1">Импорт оборудования из ФГИС Аршин</h2>
              <p className="text-sm text-neutral dark:text-white/60 mb-4">Введите название организации или серийный номер, чтобы найти приборы в реестре поверок.</p>
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <input
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm pr-7"
                    placeholder="Начните вводить название организации..."
                    value={orgQuery}
                    onChange={(e) => {
                      setOrgQuery(e.target.value);
                      fetchOrgSuggestions(e.target.value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { setOrgSuggestOpen(false); searchByOrg(); }
                      if (e.key === "Escape") setOrgSuggestOpen(false);
                    }}
                    onFocus={() => orgSuggestions.length > 0 && setOrgSuggestOpen(true)}
                    onBlur={() => setTimeout(() => setOrgSuggestOpen(false), 150)}
                    autoComplete="off"
                  />
                  {orgSuggestLoading && (
                    <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-neutral" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                  )}
                  {orgSuggestOpen && orgSuggestions.length > 0 && (
                    <ul className="absolute z-50 top-full mt-1 left-0 right-0 bg-white dark:bg-dark-light border border-gray-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden">
                      {orgSuggestions.map((s, i) => (
                        <li key={i}>
                          <button
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 text-dark dark:text-white transition-colors"
                            onMouseDown={() => {
                              setOrgQuery(s);
                              setOrgSuggestOpen(false);
                            }}
                          >
                            {s}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <button
                  onClick={() => { setOrgSuggestOpen(false); searchByOrg(); }}
                  disabled={orgSearching}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium disabled:opacity-50 hover:bg-blue-700 transition-colors shrink-0"
                >
                  {orgSearching ? "Поиск..." : "Найти"}
                </button>
              </div>
            </div>

            {/* Scrollable results */}
            {orgResults && orgResults.length > 0 && (
              <div className="px-6 overflow-y-auto flex-1 min-h-0">
                <label className="flex items-center gap-2 mb-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={orgSelected.size === orgResults.length}
                    onChange={() => {
                      if (orgSelected.size === orgResults.length) {
                        setOrgSelected(new Set());
                      } else {
                        setOrgSelected(new Set(orgResults.map((_, i) => i)));
                      }
                    }}
                  />
                  <span className="text-xs text-neutral dark:text-white/50">
                    Найдено {orgResults.length} записей — выбрано {orgSelected.size}
                  </span>
                </label>
                <div className="border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden mb-4">
                  {orgResults.map((item, i) => (
                    <label key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 border-b border-gray-100 dark:border-white/5 last:border-0 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={orgSelected.has(i)}
                        onChange={() => {
                          setOrgSelected((prev) => {
                            const next = new Set(prev);
                            if (next.has(i)) next.delete(i); else next.add(i);
                            return next;
                          });
                        }}
                        className="mt-0.5 rounded border-gray-300"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-dark dark:text-white truncate">{item.miName || "—"}</div>
                        <div className="text-xs text-neutral dark:text-white/50 mt-0.5">
                          {[item.miType, item.miSerialNumber && `№ ${item.miSerialNumber}`, item.validDate && `до ${item.validDate.split("T")[0]}`].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Fixed footer */}
            <div className="p-6 pt-3 shrink-0 flex items-center justify-between gap-3 border-t border-gray-100 dark:border-white/5">
              {orgResults && orgResults.length > 0 ? (
                <>
                  <span className="text-xs text-neutral dark:text-white/50">Выбрано: {orgSelected.size}</span>
                  <div className="flex gap-2">
                    <button onClick={() => setShowOrgImport(false)} className="px-4 py-2 rounded-xl text-sm text-neutral hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">Закрыть</button>
                    <button
                      onClick={importOrgSelected}
                      disabled={orgImporting || orgSelected.size === 0}
                      className="px-5 py-2 rounded-xl text-sm font-semibold gradient-primary text-white hover:shadow-lg hover:shadow-primary/30 transition-shadow disabled:opacity-50"
                    >
                      {orgImporting ? "Импорт..." : `Импортировать (${orgSelected.size})`}
                    </button>
                  </div>
                </>
              ) : (
                <div className="ml-auto">
                  <button onClick={() => setShowOrgImport(false)} className="px-4 py-2 rounded-xl text-sm text-neutral hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">Закрыть</button>
                </div>
              )}
            </div>
          </div>
        </div>
        </Portal>
      )}

      {/* Request confirmation modal */}
      {showRequestConfirm && (
        <Portal>
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-light rounded-2xl shadow-xl max-w-lg w-full flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="px-6 pt-6 pb-4 shrink-0 border-b border-gray-100 dark:border-white/5">
              <h2 className="text-lg font-bold text-dark dark:text-white">Создание заявки</h2>
              <p className="text-sm text-neutral dark:text-white/50 mt-0.5">
                Выбрано {selected.size} ед. оборудования
              </p>
            </div>

            {/* Scrollable content */}
            <div className="px-6 py-4 overflow-y-auto flex-1 min-h-0">
              {requestArshinLoading ? (
                <div className="flex items-center gap-2 py-6 text-sm text-neutral">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Проверяем статус поверок в Аршин...
                </div>
              ) : (
                <>
                  {/* Equipment table */}
                  <div className="border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden mb-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral dark:text-white/50 uppercase tracking-wide">Оборудование</th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral dark:text-white/50 uppercase tracking-wide">Зав. №</th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral dark:text-white/50 uppercase tracking-wide">Статус Аршин</th>
                        </tr>
                      </thead>
                      <tbody>
                        {requestArshinInfo.map((item) => (
                          <tr key={item.id} className="border-b border-gray-100 dark:border-white/5 last:border-0">
                            <td className="px-4 py-3 font-medium text-dark dark:text-white">
                              {item.name}
                            </td>
                            <td className="px-4 py-3 text-neutral dark:text-white/50 font-mono text-xs">
                              {equipment.find((e) => e.id === item.id)?.serialNumber || "—"}
                            </td>
                            <td className="px-4 py-3">
                              {item.validDate ? (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${item.expired ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${item.expired ? "bg-red-500" : "bg-green-500"}`} />
                                  {item.expired ? "Просрочена" : `до ${new Date(item.validDate).toLocaleDateString("ru-RU")}`}
                                </span>
                              ) : (
                                <span className="text-xs text-neutral dark:text-white/30">Нет данных</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {requestArshinInfo.some((i) => !i.expired && i.validDate) && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-400/30 rounded-xl text-xs text-yellow-800 dark:text-yellow-300">
                      Часть оборудования имеет действующую поверку. Убедитесь, что заявка необходима.
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 shrink-0 border-t border-gray-100 dark:border-white/5 flex justify-end gap-3">
              <button
                onClick={() => setShowRequestConfirm(false)}
                disabled={submittingRequest}
                className="px-4 py-2 rounded-xl text-sm text-neutral hover:bg-gray-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                Отмена
              </button>
              <button
                onClick={submitRequest}
                disabled={submittingRequest || requestArshinLoading}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold gradient-primary text-white hover:shadow-lg hover:shadow-primary/30 transition-shadow disabled:opacity-70"
              >
                {submittingRequest ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Создаём заявку...
                  </>
                ) : (
                  "Создать заявку"
                )}
              </button>
            </div>
          </div>
        </div>
        </Portal>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirmId !== null && (
        <Portal>
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !deleting && setDeleteConfirmId(null)}>
          <div className="bg-white dark:bg-dark-light rounded-2xl shadow-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-dark dark:text-white">Удалить оборудование?</h3>
                <p className="text-sm text-neutral dark:text-white/50 mt-0.5">Это действие нельзя отменить</p>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-white/5 rounded-xl px-4 py-3 mb-5">
              <p className="text-sm font-medium text-dark dark:text-white truncate">{deleteConfirmName}</p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-sm font-medium text-neutral hover:bg-gray-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                Отмена
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-70"
              >
                {deleting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Удаление...
                  </>
                ) : (
                  "Удалить"
                )}
              </button>
            </div>
          </div>
        </div>
        </Portal>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : equipment.length === 0 ? (
        <div className="bg-white dark:bg-dark-light rounded-2xl shadow-sm">
          <EmptyState
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            }
            title="Нет оборудования"
            description="Добавьте оборудование вручную или импортируйте список из Excel-файла"
            action={
              <button
                onClick={() => {
                  setShowForm(true);
                  setEditingId(null);
                  setForm(emptyForm);
                }}
                className="inline-flex items-center gap-2 gradient-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Добавить оборудование
              </button>
            }
          />
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {equipment.map((eq) => (
              <div
                key={eq.id}
                ref={eq.id === highlightId ? highlightRef : null}
                className={`bg-white dark:bg-dark-light rounded-2xl shadow-sm p-4 transition-all ${eq.id === highlightId ? "ring-2 ring-primary ring-offset-2" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selected.has(eq.id)}
                    onChange={() => toggleSelect(eq.id)}
                    className="mt-1 rounded border-gray-300"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium text-dark dark:text-white truncate">
                          {eq.name}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-neutral dark:text-white/50">
                          <span>{eq.type || "\u2014"}{eq.serialNumber ? ` / ${eq.serialNumber}` : ""}</span>
                          {/* ARSHIN_ENABLED: arshinUrl and arshinMismatch badges hidden */}
                        </div>
                      </div>
                      <span
                        className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[eq.status]?.color || "bg-gray-100 text-gray-600"}`}
                      >
                        {statusConfig[eq.status]?.label || eq.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-neutral flex-wrap">
                      <span>{categoryLabels[eq.category] || eq.category}</span>
                      {eq.nextVerification && (
                        <span>
                          До:{" "}
                          {new Date(eq.nextVerification).toLocaleDateString("ru-RU")}
                        </span>
                      )}
                      {/* ARSHIN_ENABLED: mitApproved badge hidden */}
                      {eq.requestItems && eq.requestItems.length > 0 && (() => {
                        const lastReq = eq.requestItems[0].request;
                        const reqStatusLabels: Record<string, { label: string; color: string }> = {
                          new: { label: "Заявка подана", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
                          in_progress: { label: "В работе", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
                          done: { label: "Выполнена", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
                        };
                        const cfg = reqStatusLabels[lastReq.status] || reqStatusLabels.new;
                        return (
                          <a href={`/dashboard/requests?expand=${lastReq.id}`} onClick={(e) => e.stopPropagation()} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium hover:opacity-80 ${cfg.color}`}>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            №{lastReq.id}: {cfg.label}
                          </a>
                        );
                      })()}
                    </div>
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <button
                        onClick={() => handlePin(eq.id, !eq.pinned)}
                        className={`text-xs ${eq.pinned ? "text-yellow-500" : "text-gray-400"} hover:underline`}
                      >
                        {eq.pinned ? "Открепить" : "Закрепить"}
                      </button>
                      <button
                        onClick={() => handleEdit(eq)}
                        className="text-xs text-primary hover:underline"
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => openHistory(eq)}
                        className="text-xs text-purple-500 hover:underline"
                      >
                        История
                      </button>
                      <button
                        onClick={() => handleDuplicate(eq)}
                        className="text-xs text-blue-500 hover:underline"
                      >
                        Дублировать
                      </button>
                      <button
                        onClick={() => handleIgnore(eq.id, !eq.ignored)}
                        className="text-xs text-amber-500 hover:underline"
                      >
                        {eq.ignored ? "Из архива" : "В архив"}
                      </button>
                      <button
                        onClick={() => handleDelete(eq.id, eq.name)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white dark:bg-dark-light rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={
                          equipment.length > 0 &&
                          selected.size === equipment.length
                        }
                        onChange={toggleAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-dark dark:text-white">
                      Наименование
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-dark dark:text-white">
                      Тип
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-dark dark:text-white">
                      Зав. №
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-dark dark:text-white">
                      Реестр
                    </th>
                    {categoryOptions.length > 1 && (
                      <th className="px-4 py-3 text-left font-semibold text-dark dark:text-white">
                        Категория
                      </th>
                    )}
                    <th className="px-4 py-3 text-left font-semibold text-dark dark:text-white">
                      След. дата
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-dark dark:text-white">
                      Статус
                    </th>
                    {/* ARSHIN_ENABLED: Пригодность column hidden */}
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {equipment.map((eq) => (
                    <tr
                      key={eq.id}
                      ref={eq.id === highlightId ? (highlightRef as React.RefObject<HTMLTableRowElement>) : null}
                      className={`border-b border-gray-100 dark:border-white/5 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] ${eq.id === highlightId ? "bg-primary/5 dark:bg-primary/10" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(eq.id)}
                          onChange={() => toggleSelect(eq.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-dark dark:text-white">
                        {eq.name}
                      </td>
                      <td className="px-4 py-3 text-neutral dark:text-white/60">
                        {eq.type || "\u2014"}
                      </td>
                      <td className="px-4 py-3 text-neutral dark:text-white/60 font-mono text-xs">
                        {eq.serialNumber || "\u2014"}
                      </td>
                      <td className="px-4 py-3 text-neutral dark:text-white/60 font-mono text-xs">
                        {eq.registryNumber || "\u2014"}
                        {/* ARSHIN_ENABLED: arshinUrl and arshinMismatch badges hidden */}
                      </td>
                      {categoryOptions.length > 1 && (
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-white/10 text-dark dark:text-white">
                            {categoryLabels[eq.category] || eq.category}
                          </span>
                        </td>
                      )}
                      <td className="px-4 py-3 text-neutral dark:text-white/60 whitespace-nowrap">
                        {eq.nextVerification
                          ? new Date(eq.nextVerification).toLocaleDateString(
                              "ru-RU",
                            )
                          : "\u2014"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[eq.status]?.color || "bg-gray-100 text-gray-600"}`}
                        >
                          {statusConfig[eq.status]?.label || eq.status}
                        </span>
                      </td>
                      {/* ARSHIN_ENABLED: mitApproved column hidden */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handlePin(eq.id, !eq.pinned)}
                            className={`p-1.5 rounded-lg transition-colors ${eq.pinned ? "text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/10" : "text-gray-300 dark:text-white/20 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-yellow-500"}`}
                            title={eq.pinned ? "Открепить" : "Закрепить"}
                          >
                            <svg className="w-4 h-4" fill={eq.pinned ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleEdit(eq)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-neutral transition-colors"
                            title="Редактировать"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => openHistory(eq)}
                            className="p-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/10 text-purple-400 transition-colors"
                            title="История поверок"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDuplicate(eq)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/10 text-blue-400 transition-colors"
                            title="Дублировать"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleIgnore(eq.id, !eq.ignored)}
                            className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/10 text-amber-400 transition-colors"
                            title={eq.ignored ? "Из архива" : "В архив"}
                          >
                            {eq.ignored ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(eq.id, eq.name)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 text-red-400 transition-colors"
                            title="Удалить"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {total > PAGE_SIZE && (
            <div className="flex items-center justify-between mt-4 px-1">
              <p className="text-sm text-neutral dark:text-white/50">
                Показано {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} из {total}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-neutral disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Первая страница"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-neutral disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Предыдущая"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* Page number buttons */}
                {(() => {
                  const totalPages = Math.ceil(total / PAGE_SIZE);
                  const pages: (number | "…")[] = [];
                  if (totalPages <= 7) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                  } else {
                    pages.push(1);
                    if (page > 3) pages.push("…");
                    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
                    if (page < totalPages - 2) pages.push("…");
                    pages.push(totalPages);
                  }
                  return pages.map((p, i) =>
                    p === "…" ? (
                      <span key={`ellipsis-${i}`} className="px-2 text-neutral dark:text-white/30 text-sm">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`min-w-[32px] h-8 rounded-lg text-sm font-medium transition-colors ${
                          p === page
                            ? "gradient-primary text-white"
                            : "hover:bg-gray-100 dark:hover:bg-white/5 text-dark dark:text-white"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  );
                })()}

                <button
                  onClick={() => setPage((p) => Math.min(Math.ceil(total / PAGE_SIZE), p + 1))}
                  disabled={page >= Math.ceil(total / PAGE_SIZE)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-neutral disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Следующая"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => setPage(Math.ceil(total / PAGE_SIZE))}
                  disabled={page >= Math.ceil(total / PAGE_SIZE)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-neutral disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Последняя страница"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Comparison modal */}
      {showCompare && compareItems.length >= 2 && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCompare(false)}>
            <div className="bg-white dark:bg-dark-light rounded-2xl shadow-xl max-w-4xl w-full max-h-[85vh] overflow-auto p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-dark dark:text-white">Сравнение оборудования</h2>
                <button onClick={() => setShowCompare(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-neutral">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-white/10">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-neutral dark:text-white/50 w-32">Характеристика</th>
                      {compareItems.map((eq) => (
                        <th key={eq.id} className="px-3 py-2 text-left text-sm font-semibold text-dark dark:text-white min-w-[150px]">{eq.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: "Тип/Модель", key: "type" },
                      { label: "Зав. номер", key: "serialNumber" },
                      { label: "Реестр", key: "registryNumber" },
                      { label: "Категория", key: "category" },
                      { label: "Интервал (мес.)", key: "interval" },
                      { label: "Дата поверки", key: "verificationDate" },
                      { label: "След. дата", key: "nextVerification" },
                      { label: "Статус", key: "status" },
                      { label: "Организация", key: "company" },
                    ].map((row) => (
                      <tr key={row.key} className="border-b border-gray-100 dark:border-white/5">
                        <td className="px-3 py-2 text-xs font-medium text-neutral dark:text-white/50">{row.label}</td>
                        {compareItems.map((eq) => {
                          let val: string = String((eq as unknown as Record<string, unknown>)[row.key] ?? "—");
                          if ((row.key === "verificationDate" || row.key === "nextVerification") && val && val !== "—") {
                            val = new Date(val).toLocaleDateString("ru-RU");
                          }
                          if (row.key === "status") val = statusConfig[eq.status]?.label || eq.status;
                          if (row.key === "category") val = categoryLabels[eq.category] || eq.category;
                          return <td key={eq.id} className="px-3 py-2 text-sm text-dark dark:text-white">{val || "—"}</td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Verification history modal */}
      {historyEquipmentId !== null && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setHistoryEquipmentId(null)}>
            <div className="bg-white dark:bg-dark-light rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 pt-6 pb-4 shrink-0 border-b border-gray-100 dark:border-white/5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-dark dark:text-white">История поверок</h2>
                  <button onClick={() => setHistoryEquipmentId(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-neutral">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-neutral dark:text-white/50 mt-1">{historyEquipmentName}</p>
              </div>
              <div className="px-6 py-4 overflow-y-auto flex-1 min-h-0">
                {historyLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : historyRecords.length === 0 ? (
                  <p className="text-sm text-neutral dark:text-white/50 py-8 text-center">
                    Записей пока нет
                  </p>
                ) : (
                  <div className="space-y-4">
                    {historyRecords.map((rec) => (
                      <div key={rec.id} className="relative pl-6 border-l-2 border-primary/20 pb-2">
                        <div className="absolute left-[-5px] top-0 w-2 h-2 rounded-full bg-primary" />
                        <div className="text-sm font-medium text-dark dark:text-white">
                          {new Date(rec.date).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
                        </div>
                        {rec.nextDate && (
                          <div className="text-xs text-neutral dark:text-white/50 mt-0.5">
                            Следующая: {new Date(rec.nextDate).toLocaleDateString("ru-RU")}
                          </div>
                        )}
                        {rec.result && (
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${rec.result === "годен" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {rec.result}
                          </span>
                        )}
                        {rec.performer && <div className="text-xs text-neutral dark:text-white/40 mt-1">Поверитель: {rec.performer}</div>}
                        {rec.certificate && <div className="text-xs text-neutral dark:text-white/40">Свидетельство: {rec.certificate}</div>}
                        {rec.notes && <div className="text-xs text-neutral dark:text-white/40 mt-1 italic">{rec.notes}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="px-6 py-3 shrink-0 border-t border-gray-100 dark:border-white/5">
                <button
                  onClick={() => setHistoryEquipmentId(null)}
                  className="px-4 py-2 rounded-xl text-sm text-neutral hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
