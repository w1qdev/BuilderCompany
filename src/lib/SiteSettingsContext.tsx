"use client";

import { createContext, useContext, useEffect, useState } from "react";

export interface SiteSettings {
  phone: string;
  email: string;
  address: string;
}

const DEFAULTS: SiteSettings = {
  phone: "+7 (966) 730-30-03",
  email: "info@csm-center.ru",
  address: "г. Москва, ул. Метрологическая, д. 10, офис 205",
};

const SiteSettingsContext = createContext<SiteSettings>(DEFAULTS);

export function SiteSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULTS);

  useEffect(() => {
    fetch("/api/settings/public")
      .then((r) => r.json())
      .then((data) => setSettings(data))
      .catch(() => {});
  }, []);

  return (
    <SiteSettingsContext.Provider value={settings}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
