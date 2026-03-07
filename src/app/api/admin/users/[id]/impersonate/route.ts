import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminPassword } from "@/lib/adminAuth";
import { SignJWT } from "jose";
import { JWT_SECRET } from "@/lib/jwt";
import { createRateLimiter } from "@/lib/rateLimit";

// Лимитируем операции "войти как"
const adminImpersonateLimiter = createRateLimiter({
  max: 20,
  windowMs: 60 * 1000,
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!adminImpersonateLimiter(request)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const headerPassword = request.headers.get("x-admin-password") || "";
  if (!headerPassword || !(await verifyAdminPassword(headerPassword))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id: Number(id) } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const token = await new SignJWT({ userId: user.id, email: user.email })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1h")
    .sign(JWT_SECRET);

  const response = NextResponse.json({ success: true });
  response.cookies.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 3600,
    path: "/",
  });
  return response;
}
