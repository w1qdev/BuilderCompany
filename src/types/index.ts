/**
 * Shared TypeScript types used across the application.
 */

// ─── Equipment ────────────────────────────────────────────────────────────────

export interface Equipment {
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
}

/** Lightweight version used in schedule/calendar views */
export interface EquipmentScheduleItem
  extends Pick<Equipment, "id" | "name" | "type" | "serialNumber" | "registryNumber" | "nextVerification" | "category" | "status"> {}

// ─── Service Items / Request Items ─────────────────────────────────────────────

export interface ServiceItem {
  id: number;
  service: string;
  poverk?: string | null;
  object?: string | null;
  fabricNumber?: string | null;
  registry?: string | null;
}

// ─── Requests ─────────────────────────────────────────────────────────────────

export interface RequestFile {
  id: number;
  fileName: string;
  filePath: string;
}

export interface Request {
  id: number;
  name: string;
  phone: string;
  email: string;
  company?: string | null;
  inn?: string | null;
  service: string;
  object?: string | null;
  fabricNumber?: string | null;
  registry?: string | null;
  poverk?: string | null;
  message?: string | null;
  fileName?: string | null;
  filePath?: string | null;
  files?: RequestFile[];
  status: string;
  createdAt: string;
  needContract?: boolean;
  items?: ServiceItem[];
}

export interface AdminRequest extends Request {
  adminNotes: string | null;
  executorPrice: number | null;
  markup: number | null;
  clientPrice: number | null;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  company: string | null;
}

export interface UserProfile extends User {
  createdAt: string;
}
