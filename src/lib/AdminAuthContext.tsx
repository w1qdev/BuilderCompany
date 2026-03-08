"use client";

import { Input } from "@/components/ui/input";
import { createContext, useContext, useEffect, useState, useCallback } from "react";

interface AdminAuthContextType {
  password: string;
  token: string;
  authenticated: boolean;
  role: string;
  staffId: number | null;
  staffName: string;
  login: (password: string, loginName?: string) => void;
  logout: () => void;
  getAuthHeaders: () => Record<string, string>;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [role, setRole] = useState("admin");
  const [staffId, setStaffId] = useState<number | null>(null);
  const [staffName, setStaffName] = useState("");
  const [initializing, setInitializing] = useState(true);
  const [inputLogin, setInputLogin] = useState("");
  const [inputPassword, setInputPassword] = useState("");
  const [error, setError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    const storedToken = sessionStorage.getItem("admin-token");
    const storedPassword = sessionStorage.getItem("admin-password");
    const storedRole = sessionStorage.getItem("admin-role");
    const storedStaffId = sessionStorage.getItem("admin-staff-id");
    const storedStaffName = sessionStorage.getItem("admin-staff-name");

    if (storedToken) {
      setToken(storedToken);
      setRole(storedRole || "admin");
      setStaffId(storedStaffId ? parseInt(storedStaffId) : null);
      setStaffName(storedStaffName || "");
      if (storedPassword) setPassword(storedPassword);
      setAuthenticated(true);
    } else if (storedPassword) {
      // Legacy: password-only session (backward compat)
      setPassword(storedPassword);
      setAuthenticated(true);
    }
    setInitializing(false);
  }, []);

  const login = async (pwd: string, loginName?: string) => {
    setError("");
    setLoginLoading(true);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          login: loginName || undefined,
          password: pwd,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Ошибка авторизации");
        return;
      }

      // Store auth data
      sessionStorage.setItem("admin-token", data.token);
      sessionStorage.setItem("admin-role", data.role);
      sessionStorage.setItem("admin-staff-name", data.name);

      if (data.staffId !== null) {
        sessionStorage.setItem("admin-staff-id", String(data.staffId));
      } else {
        sessionStorage.removeItem("admin-staff-id");
      }

      // For admin (legacy compat), also store password for x-admin-password header
      if (!loginName) {
        sessionStorage.setItem("admin-password", pwd);
        setPassword(pwd);
      }

      setToken(data.token);
      setRole(data.role);
      setStaffId(data.staffId);
      setStaffName(data.name);
      setAuthenticated(true);
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setLoginLoading(false);
    }
  };

  const logout = () => {
    setAuthenticated(false);
    setPassword("");
    setToken("");
    setRole("admin");
    setStaffId(null);
    setStaffName("");
    sessionStorage.removeItem("admin-password");
    sessionStorage.removeItem("admin-token");
    sessionStorage.removeItem("admin-role");
    sessionStorage.removeItem("admin-staff-id");
    sessionStorage.removeItem("admin-staff-name");
  };

  const getAuthHeaders = useCallback((): Record<string, string> => {
    const headers: Record<string, string> = {};
    if (token) {
      headers["x-admin-token"] = token;
    }
    if (password) {
      headers["x-admin-password"] = password;
    }
    return headers;
  }, [token, password]);

  if (initializing) {
    return (
      <div className="min-h-screen bg-warm-bg dark:bg-dark flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-warm-bg dark:bg-dark flex items-center justify-center p-4">
        <div className="w-full" style={{ maxWidth: 384 }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void login(inputPassword, inputLogin || undefined);
          }}
          className="bg-white dark:bg-dark-light rounded-3xl shadow-xl p-8"
        >
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
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold text-dark dark:text-white">Админ-панель</h1>
            <p className="text-neutral dark:text-white/50 text-sm mt-1">
              Введите данные для входа
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <Input
            type="text"
            placeholder="Логин (необязательно)"
            value={inputLogin}
            onChange={(e) => setInputLogin(e.target.value)}
            className="mb-3 dark:bg-dark dark:border-white/10 dark:text-white"
            autoComplete="username"
          />
          <Input
            type="password"
            placeholder="Пароль"
            value={inputPassword}
            onChange={(e) => setInputPassword(e.target.value)}
            className="mb-2 dark:bg-dark dark:border-white/10 dark:text-white"
            autoComplete="current-password"
          />
          <p className="text-xs text-neutral dark:text-white/40 mb-4">
            Сотрудники вводят логин и пароль. Администратор — только пароль.
          </p>
          <button
            type="submit"
            disabled={loginLoading}
            className="w-full gradient-primary text-white py-3 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-primary/30 transition-shadow disabled:opacity-60"
          >
            {loginLoading ? "Проверка..." : "Войти"}
          </button>
        </form>
        </div>
      </div>
    );
  }

  return (
    <AdminAuthContext.Provider
      value={{
        password,
        token,
        authenticated,
        role,
        staffId,
        staffName,
        login,
        logout,
        getAuthHeaders,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}
