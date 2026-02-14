"use client";

import { Input } from "@/components/ui/input";
import { createContext, useContext, useEffect, useState } from "react";

interface AdminAuthContextType {
  password: string;
  authenticated: boolean;
  login: (password: string) => void;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [inputPassword, setInputPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("admin-password");
    if (stored) {
      setPassword(stored);
      setAuthenticated(true);
    }
    setInitializing(false);
  }, []);

  const login = (pwd: string) => {
    setError("");
    sessionStorage.setItem("admin-password", pwd);
    setPassword(pwd);
    setAuthenticated(true);
  };

  const logout = () => {
    setAuthenticated(false);
    setPassword("");
    sessionStorage.removeItem("admin-password");
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-warm-bg flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-warm-bg flex items-center justify-center p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            login(inputPassword);
          }}
          className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-sm"
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
            <h1 className="text-2xl font-extrabold text-dark">Админ-панель</h1>
            <p className="text-neutral text-sm mt-1">
              Введите пароль для входа
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <Input
            type="password"
            placeholder="Пароль"
            value={inputPassword}
            onChange={(e) => setInputPassword(e.target.value)}
            className="mb-4"
          />
          <button
            type="submit"
            className="w-full gradient-primary text-white py-3 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-primary/30 transition-shadow"
          >
            Войти
          </button>
        </form>
      </div>
    );
  }

  return (
    <AdminAuthContext.Provider value={{ password, authenticated, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}
