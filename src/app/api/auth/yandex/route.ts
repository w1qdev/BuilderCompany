import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Redirect to Yandex OAuth
export async function GET(request: NextRequest) {
  const clientId = process.env.YANDEX_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Яндекс OAuth не настроен" }, { status: 503 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://csm-center.ru";
  const redirectUri = `${siteUrl}/api/auth/yandex/callback`;

  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: "login:email login:info",
    force_confirm: "false",
  });

  const url = `https://oauth.yandex.ru/authorize?${params}`;

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
