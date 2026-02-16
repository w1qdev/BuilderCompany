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

  const clientId = process.env.VK_CLIENT_ID!;
  const clientSecret = process.env.VK_CLIENT_SECRET!;
  const redirectUri = `${siteUrl}/api/auth/vk/callback`;

  try {
    // Exchange code for token
    const tokenRes = await fetch(
      `https://oauth.vk.com/access_token?client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`
    );

    if (!tokenRes.ok) {
      throw new Error("Token exchange failed");
    }

    const tokenData = await tokenRes.json();
    const accessToken: string = tokenData.access_token;
    const vkUserId: number = tokenData.user_id;
    const email: string = tokenData.email;

    // Fetch name from VK API
    const userRes = await fetch(
      `https://api.vk.com/method/users.get?user_ids=${vkUserId}&fields=first_name,last_name&access_token=${accessToken}&v=5.199`
    );

    let name = email ? email.split("@")[0] : `vk_${vkUserId}`;
    if (userRes.ok) {
      const userData = await userRes.json();
      const vkUser = userData.response?.[0];
      if (vkUser) {
        name = `${vkUser.first_name} ${vkUser.last_name}`.trim() || name;
      }
    }

    if (!email) {
      // VK may not return email if user denied permission
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
    console.error("VK OAuth callback error:", e);
    return NextResponse.redirect(`${siteUrl}/login?error=oauth`);
  }
}
