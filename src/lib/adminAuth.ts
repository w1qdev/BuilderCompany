import bcrypt from "bcryptjs";
import { jwtVerify } from "jose";
import { JWT_SECRET } from "@/lib/jwt";
import { prisma } from "./prisma";

export async function verifyAdminPassword(password: string): Promise<boolean> {
  if (!password) return false;

  const stored = await prisma.setting.findUnique({ where: { key: "adminPassword" } });
  if (stored) {
    return bcrypt.compare(password, stored.value);
  }

  // Fall back to env var (plain text) until password is changed via admin panel
  return password === process.env.ADMIN_PASSWORD;
}

/**
 * Verify admin auth from request headers.
 * Checks either x-admin-password (legacy) or x-admin-token (JWT for staff/admin).
 * Returns role info on success, null on failure.
 */
export async function verifyAdminAuth(
  req: Request
): Promise<{ role: string; staffId: number | null } | null> {
  // Check admin password first (legacy header)
  const pwd = req.headers.get("x-admin-password");
  if (pwd && (await verifyAdminPassword(pwd))) {
    return { role: "admin", staffId: null };
  }

  // Check staff/admin JWT token
  const token = req.headers.get("x-admin-token");
  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const staffId = payload.staffId as number | null;
      const role = payload.role as string;

      // Admin token (no staffId) — valid as-is
      if (staffId === null && role === "admin") {
        return { role: "admin", staffId: null };
      }

      // Staff token — verify staff still exists and is active
      if (staffId) {
        const staff = await prisma.staff.findUnique({
          where: { id: staffId },
        });
        if (staff && staff.active) {
          return { role: staff.role, staffId: staff.id };
        }
      }
    } catch {
      // Token invalid or expired
    }
  }

  return null;
}
