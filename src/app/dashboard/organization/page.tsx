"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useSocket } from "@/lib/useSocket";

interface OrgMember {
  id: number;
  userId: number;
  role: string;
  user: { id: number; name: string; email: string };
}

interface Organization {
  id: number;
  name: string;
  inn: string | null;
  kpp: string | null;
  address: string | null;
  role: string;
  equipmentCount: number;
  members: OrgMember[];
}

export default function OrganizationPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", inn: "", kpp: "", address: "" });
  const [creating, setCreating] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteOrgId, setInviteOrgId] = useState<number | null>(null);
  const [inviting, setInviting] = useState(false);

  const fetchOrgs = async () => {
    try {
      const res = await fetch("/api/organizations");
      if (res.ok) {
        const data = await res.json();
        setOrganizations(data.organizations);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgs();
  }, []);

  // Realtime: refetch when members or equipment change
  const socket = useSocket({ orgIds: organizations.map((o) => o.id) });
  useEffect(() => {
    if (!socket) return;
    const handler = () => fetchOrgs();
    socket.on("org-member-changed", handler);
    socket.on("equipment-changed", handler);
    return () => {
      socket.off("org-member-changed", handler);
      socket.off("equipment-changed", handler);
    };
  }, [socket]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = async () => {
    if (!createForm.name.trim()) {
      toast.error("Укажите название организации");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      if (res.ok) {
        toast.success("Организация создана");
        setShowCreate(false);
        setCreateForm({ name: "", inn: "", kpp: "", address: "" });
        fetchOrgs();
      } else {
        const data = await res.json();
        toast.error(data.error || "Ошибка");
      }
    } catch {
      toast.error("Ошибка");
    } finally {
      setCreating(false);
    }
  };

  const handleInvite = async (orgId: number) => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const res = await fetch("/api/organizations/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: orgId, email: inviteEmail.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Сотрудник добавлен");
        setInviteEmail("");
        setInviteOrgId(null);
        fetchOrgs();
      } else {
        toast.error(data.error || "Ошибка");
      }
    } catch {
      toast.error("Ошибка");
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (orgId: number, memberId: number) => {
    try {
      const res = await fetch(`/api/organizations/members?organizationId=${orgId}&userId=${memberId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Участник удалён");
        fetchOrgs();
      }
    } catch {
      toast.error("Ошибка");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-dark dark:text-white">Организация</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Создать организацию
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-white dark:bg-dark-light rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-dark dark:text-white mb-4">Новая организация</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="org-name" className="block text-sm font-medium text-dark dark:text-white/70 mb-1">Название *</label>
              <input
                id="org-name"
                type="text"
                value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="ООО «Компания»"
              />
            </div>
            <div>
              <label htmlFor="org-inn" className="block text-sm font-medium text-dark dark:text-white/70 mb-1">ИНН</label>
              <input
                id="org-inn"
                type="text"
                value={createForm.inn}
                onChange={(e) => setCreateForm((f) => ({ ...f, inn: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="1234567890"
              />
            </div>
            <div>
              <label htmlFor="org-kpp" className="block text-sm font-medium text-dark dark:text-white/70 mb-1">КПП</label>
              <input
                id="org-kpp"
                type="text"
                value={createForm.kpp}
                onChange={(e) => setCreateForm((f) => ({ ...f, kpp: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="123456789"
              />
            </div>
            <div>
              <label htmlFor="org-address" className="block text-sm font-medium text-dark dark:text-white/70 mb-1">Адрес</label>
              <input
                id="org-address"
                type="text"
                value={createForm.address}
                onChange={(e) => setCreateForm((f) => ({ ...f, address: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="г. Москва, ул. Примерная, д. 1"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCreate}
              disabled={creating}
              className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {creating ? (
                "Создание..."
              ) : (
                <><svg className="w-4 h-4 inline-block mr-1.5 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Создать</>
              )}
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 dark:border-white/10 text-dark dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Organizations list */}
      {organizations.length === 0 ? (
        <div className="bg-white dark:bg-dark-light rounded-2xl shadow-sm p-12 text-center">
          <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-white/20 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="text-lg font-semibold text-dark dark:text-white mb-1">Нет организаций</h3>
          <p className="text-sm text-neutral dark:text-white/50">Создайте организацию для совместной работы с оборудованием</p>
        </div>
      ) : (
        <div className="space-y-4">
          {organizations.map((org) => (
            <div key={org.id} className="bg-white dark:bg-dark-light rounded-2xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-dark dark:text-white">{org.name}</h2>
                  <div className="flex items-center gap-4 mt-1 text-xs text-neutral dark:text-white/50">
                    {org.inn && <span>ИНН: {org.inn}</span>}
                    {org.kpp && <span>КПП: {org.kpp}</span>}
                    <span>{org.equipmentCount} ед. оборудования</span>
                  </div>
                  {org.address && <p className="text-sm text-neutral dark:text-white/50 mt-1">{org.address}</p>}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${org.role === "admin" ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/60"}`}>
                  {org.role === "admin" ? "Администратор" : "Участник"}
                </span>
              </div>

              {/* Members */}
              <div className="border-t border-gray-100 dark:border-white/10 pt-4">
                <h3 className="text-sm font-semibold text-dark dark:text-white mb-3">
                  Сотрудники ({org.members.length})
                </h3>
                <div className="space-y-2">
                  {org.members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-gray-50 dark:bg-white/5">
                      <div>
                        <span className="text-sm font-medium text-dark dark:text-white">{m.user.name}</span>
                        <span className="text-xs text-neutral dark:text-white/50 ml-2">{m.user.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${m.role === "admin" ? "bg-primary/10 text-primary" : "bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-white/50"}`}>
                          {m.role === "admin" ? "Админ" : "Участник"}
                        </span>
                        {org.role === "admin" && m.userId !== org.members.find((x) => x.role === "admin")?.userId && (
                          <button
                            onClick={() => handleRemoveMember(org.id, m.userId)}
                            className="inline-flex items-center gap-1 text-xs text-red-500 hover:underline"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            Удалить
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Invite */}
                {org.role === "admin" && (
                  <div className="mt-3">
                    {inviteOrgId === org.id ? (
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="Email сотрудника"
                          className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                          onKeyDown={(e) => e.key === "Enter" && handleInvite(org.id)}
                        />
                        <button
                          onClick={() => handleInvite(org.id)}
                          disabled={inviting}
                          className="inline-flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
                        >
                          {inviting ? "..." : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Добавить</>}
                        </button>
                        <button
                          onClick={() => { setInviteOrgId(null); setInviteEmail(""); }}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border border-gray-200 dark:border-white/10 text-dark dark:text-white hover:bg-gray-50 dark:hover:bg-white/5"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          Отмена
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setInviteOrgId(org.id)}
                        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        Добавить сотрудника
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Link to org equipment */}
              <div className="border-t border-gray-100 dark:border-white/10 pt-4 mt-4">
                <a
                  href={`/dashboard/equipment/si?orgId=${org.id}`}
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Оборудование организации ({org.equipmentCount})
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
