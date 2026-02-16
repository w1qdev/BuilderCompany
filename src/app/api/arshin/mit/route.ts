import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { JWT_SECRET } from "@/lib/jwt";

export const dynamic = "force-dynamic";

// FGIS Arshin — MIT registry (допущенные типы СИ)
// https://fgis.gost.ru/fundmetrology/eapi/mit
const MIT_BASE = "https://fgis.gost.ru/fundmetrology/eapi/mit";

interface MitItem {
  id?: string;
  mit_id?: string;
  mit_number?: string;
  number?: string;
  mit_title?: string;
  title?: string;
  mit_notation?: string;
  notation?: string;
  mit_manufacturer?: string;
  manufacturer?: string;
  mit_status?: string;
  status?: string;
  applicability?: string;
  mit_link?: string;
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;
    if (!token) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    await jwtVerify(token, JWT_SECRET);

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();
    if (!query) return NextResponse.json({ error: "Укажите запрос" }, { status: 400 });

    const url = `${MIT_BASE}?search=${encodeURIComponent(query)}&rows=10&start=0`;

    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return NextResponse.json({ items: [] });
    }

    const data = await res.json();
    const rawItems: MitItem[] = data?.result?.items || [];

    const items = rawItems
      .filter((item) => item.mit_title || item.title)
      .map((item) => {
        const mitId = item.mit_id || item.id || "";
        return {
          mitId,
          mitNumber: item.mit_number || item.number || "",
          mitTitle: item.mit_title || item.title || "",
          mitNotation: item.mit_notation || item.notation || "",
          mitManufacturer: item.mit_manufacturer || item.manufacturer || "",
          mitStatus: item.mit_status || item.status || item.applicability || "",
          mitUrl: mitId ? `https://fgis.gost.ru/fundmetrology/cm/mit/${mitId}` : "",
          isApproved: true, // if it's in the registry, it's approved
        };
      });

    return NextResponse.json({ items, total: items.length });
  } catch (e: unknown) {
    if (e instanceof Error && e.name === "TimeoutError") {
      return NextResponse.json({ error: "Таймаут запроса к Аршин" }, { status: 504 });
    }
    console.error("MIT proxy error:", e);
    return NextResponse.json({ error: "Ошибка запроса к ФГИС Аршин" }, { status: 500 });
  }
}
