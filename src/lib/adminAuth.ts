import bcrypt from "bcryptjs";
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
