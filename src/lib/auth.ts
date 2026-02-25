import { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { JWT_SECRET } from "@/lib/jwt";

export async function getUserId(request: NextRequest): Promise<number | null> {
  const token = request.cookies.get("auth-token")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.userId as number;
  } catch {
    return null;
  }
}
