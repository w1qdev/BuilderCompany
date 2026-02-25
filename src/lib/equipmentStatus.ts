/**
 * Shared equipment verification status calculation.
 * Used across API routes and components.
 */

export type EquipmentStatusType = "active" | "pending" | "expired";

/** Threshold in days for "pending" (approaching verification) status */
const PENDING_THRESHOLD_DAYS = 14;

/**
 * Calculate equipment status based on nextVerification date.
 * - "expired": date is in the past
 * - "pending": date is within 14 days
 * - "active": default
 */
export function calculateEquipmentStatus(nextVerification: Date | string | null | undefined): EquipmentStatusType {
  if (!nextVerification) return "active";
  const nextDate = typeof nextVerification === "string" ? new Date(nextVerification) : nextVerification;
  const now = new Date();
  if (nextDate < now) return "expired";
  const threshold = new Date(now.getTime() + PENDING_THRESHOLD_DAYS * 24 * 60 * 60 * 1000);
  if (nextDate < threshold) return "pending";
  return "active";
}

/**
 * Days remaining until nextVerification. Negative = overdue.
 */
export function daysUntilVerification(nextVerification: Date | string | null | undefined): number | null {
  if (!nextVerification) return null;
  const nextDate = typeof nextVerification === "string" ? new Date(nextVerification) : nextVerification;
  const now = new Date();
  return Math.round((nextDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
}

/** Status display config (labels and colors) for UI */
export const statusConfig: Record<EquipmentStatusType, { label: string; color: string }> = {
  active: { label: "Активно", color: "bg-green-100 text-green-800" },
  pending: { label: "Скоро поверка", color: "bg-yellow-100 text-yellow-800" },
  expired: { label: "Просрочено", color: "bg-red-100 text-red-800" },
};
