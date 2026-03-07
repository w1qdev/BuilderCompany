import { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { createHash } from "crypto";
import { JWT_SECRET } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";

/**
 * Возвращает ID пользователя по JWT-cookie, если:
 * - токен валиден;
 * - пользователь существует и не заблокирован (banned = false);
 * - (если есть запись сессии) сессия не отозвана (revoked = false).
 *
 * В противном случае возвращает null.
 */
export async function getUserId(request: NextRequest): Promise<number | null> {
  const token = request.cookies.get("auth-token")?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as number;

    // 1) Проверяем, что пользователь существует и не заблокирован
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { banned: true },
    });
    if (!user || user.banned) {
      return null;
    }

    // 2) Опционально учитываем отзыв сессий (userSession.revoked)
    //    Для токенов, по которым нет записи, считаем сессию валидной.
    try {
      const tokenHash = createHash("sha256").update(token).digest("hex");
      const session = await prisma.userSession.findFirst({
        where: { userId, tokenHash },
        select: { revoked: true },
      });
      if (session && session.revoked) {
        return null;
      }
    } catch {
      // Не ломаем авторизацию, если сессии по какой-то причине недоступны
    }

    return userId;
  } catch {
    return null;
  }
}
