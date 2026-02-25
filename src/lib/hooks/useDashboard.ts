"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error("Fetch error");
  return res.json();
});

const SWR_OPTIONS = {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 30000, // 30s dedup
};

export function useDashboardStats() {
  return useSWR("/api/user/dashboard-stats", fetcher, {
    ...SWR_OPTIONS,
    refreshInterval: 60000, // auto-refresh every 60s
  });
}

export function useUserInfo() {
  return useSWR("/api/auth/me", fetcher, SWR_OPTIONS);
}

export function useCalendarEquipment() {
  return useSWR("/api/equipment/calendar", fetcher, {
    ...SWR_OPTIONS,
    refreshInterval: 120000, // 2 min
  });
}
