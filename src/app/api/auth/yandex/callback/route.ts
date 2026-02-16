import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SignJWT } from "jose";
import { JWT_SECRET } from "@/lib/jwt";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://csm-center.ru";
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const storedState = request.cookies.get("oauth_state")?.value;

  if (!code || state !== storedState) {
    return NextResponse.redirect(`${siteUrl}/login?error=oauth`);
  }

  const clientId = process.env.YANDEX_CLIENT_ID!;
  const clientSecret = process.env.YANDEX_CLIENT_SECRET!;
  const redirectUri = `${siteUrl}/api/auth/yandex/callback`;

  try {
    // Exchange code for token
    const tokenRes = await fetch("https://oauth.yandex.ru/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      throw new Error("Token exchange failed");
    }

    const tokenData = await tokenRes.json();
    const accessToken: string = tokenData.access_token;

    // Fetch user info
    const userRes = await fetch("https://login.yandex.ru/info?format=json", {
      headers: { Authorization: `OAuth ${accessToken}` },
    });

    if (!userRes.ok) {
      throw new Error("Failed to fetch user info");
    }

    const yandexUser = await userRes.json();
    const email: string = yandexUser.default_email || yandexUser.emails?.[0];
    const name: string = yandexUser.real_name || yandexUser.display_name || yandexUser.login || email;

    if (!email) {
      return NextResponse.redirect(`${siteUrl}/login?error=no_email`);
    }

    // Find or create user
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          password: "", // OAuth users have no password
        },
      });
    }

    // Create JWT
    const token = await new SignJWT({ userId: user.id, email: user.email })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("30d")
      .sign(JWT_SECRET);

    const response = NextResponse.redirect(`${siteUrl}/dashboard`);
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });
    response.cookies.delete("oauth_state");
    return response;
  } catch (e) {
    console.error("Yandex OAuth callback error:", e);
    return NextResponse.redirect(`${siteUrl}/login?error=oauth`);
  }
}
