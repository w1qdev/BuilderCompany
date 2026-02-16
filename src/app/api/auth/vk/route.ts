import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Redirect to VK OAuth (VK ID / VK Connect)
export async function GET(request: NextRequest) {
  const clientId = process.env.VK_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "VK OAuth не настроен" }, { status: 503 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://csm-center.ru";
  const redirectUri = `${siteUrl}/api/auth/vk/callback`;

  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    display: "page",
    scope: "email",
    response_type: "code",
    v: "5.199",
    state,
  });

  const url = `https://oauth.vk.com/authorize?${params}`;

  const res = NextResponse.redirect(url);
  res.cookies.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return res;
}
