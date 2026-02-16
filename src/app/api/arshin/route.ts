import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { JWT_SECRET } from "@/lib/jwt";

export const dynamic = "force-dynamic";

// FGIS Arshin — Solr API (used by the website itself)
// Endpoint: https://fgis.gost.ru/fundmetrology/cm/xcdb/vri/select
// Fields: vri_id, org_title, mi.mitnumber, mi.mititle, mi.mitype, mi.modification,
//         mi.number (serial), verification_date, valid_date
const VRI_BASE = "https://fgis.gost.ru/fundmetrology/cm/xcdb/vri/select";
const MIT_BASE = "https://fgis.gost.ru/fundmetrology/eapi/mit";

const VRI_FIELDS = "vri_id,org_title,mi.mitnumber,mi.mititle,mi.mitype,mi.modification,mi.number,verification_date,valid_date";

function buildVriUrl(fq: string, rows: number) {
  // URLSearchParams encodes * as %2A — Solr needs literal * for wildcards, so build manually
  const fl = encodeURIComponent(VRI_FIELDS);
  const fqEnc = encodeURIComponent(fq).replace(/%2A/gi, "*");
  return `${VRI_BASE}?fq=${fqEnc}&q=*&fl=${fl}&rows=${rows}&start=0`;
}

function buildOrgPhraseUrl(orgTitle: string, rows: number, start = 0) {
  const fl = encodeURIComponent(VRI_FIELDS);
  // Phrase query: org_title:"exact name" — works with spaces & special chars, no wildcard escaping needed
  // Only escape " and \ inside the phrase
  const escaped = orgTitle.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const fq = `org_title:"${escaped}"`;
  return `${VRI_BASE}?fq=${encodeURIComponent(fq)}&q=*&fl=${fl}&rows=${rows}&start=${start}`;
}

function buildSuggestUrl(partialQuery: string, rows: number) {
  const fl = encodeURIComponent(VRI_FIELDS);
  // General wildcard — use only the last typed word to avoid multi-word issues
  const lastWord = partialQuery.trim().split(/\s+/).pop() || partialQuery;
  const fqEnc = encodeURIComponent(`*${lastWord}*`).replace(/%2A/gi, "*");
  return `${VRI_BASE}?fq=${fqEnc}&q=*&fl=${fl}&rows=${rows}&start=0`;
}

const fetchJson = (url: string) =>
  fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" },
    signal: AbortSignal.timeout(10000),
  })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);

// Solr response shape: { response: { docs: [...], numFound: number } }
function getVriDocs(data: unknown): Record<string, unknown>[] {
  return (data as { response?: { docs?: Record<string, unknown>[] } } | null)?.response?.docs || [];
}

function getVriNumFound(data: unknown): number {
  return (data as { response?: { numFound?: number } } | null)?.response?.numFound || 0;
}

// Fetch ALL pages for org search (up to maxTotal items)
async function fetchAllOrgDocs(orgTitle: string, maxTotal = 500): Promise<Record<string, unknown>[]> {
  const pageSize = 100;
  const firstUrl = buildOrgPhraseUrl(orgTitle, pageSize, 0);
  const firstData = await fetchJson(firstUrl);
  const total = Math.min(getVriNumFound(firstData), maxTotal);
  const allDocs = [...getVriDocs(firstData)];

  if (total > pageSize) {
    const extraPages: Promise<unknown>[] = [];
    for (let start = pageSize; start < total; start += pageSize) {
      extraPages.push(fetchJson(buildOrgPhraseUrl(orgTitle, pageSize, start)));
    }
    const results = await Promise.all(extraPages);
    for (const r of results) {
      allDocs.push(...getVriDocs(r));
    }
  }

  return allDocs;
}

function parseVriDoc(item: Record<string, unknown>) {
  const vriId = (item["vri_id"] as string) || "";
  return {
    miName: (item["mi.mititle"] as string) || "",
    miType: (item["mi.mitype"] as string) || (item["mi.modification"] as string) || "",
    miManufacturer: "",
    miSerialNumber: (item["mi.number"] as string) || "",
    miRegestryNumber: (item["mi.mitnumber"] as string) || "",
    orgTitle: (item["org_title"] as string) || "",
    validDate: (item["valid_date"] as string) || "",
    vriDate: (item["verification_date"] as string) || "",
    arshinUrl: vriId ? `https://fgis.gost.ru/fundmetrology/cm/results/${vriId}` : "",
    source: "vri" as const,
  };
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    await jwtVerify(token, JWT_SECRET);

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();
    if (!query) {
      return NextResponse.json({ error: "Укажите номер реестра или серийный номер" }, { status: 400 });
    }

    const isOrgSearch = searchParams.get("org") === "1";
    const isSuggest = searchParams.get("suggest") === "1";

    // Suggest mode: return unique org names matching the partial query
    if (isSuggest) {
      const vriUrl = buildSuggestUrl(query, 50);
      const data = await fetchJson(vriUrl);
      const docs = getVriDocs(data);
      const orgNames = new Set<string>();
      for (const doc of docs) {
        const org = (doc["org_title"] as string)?.trim();
        if (org && org.length > 3) orgNames.add(org);
      }
      return NextResponse.json({ suggestions: Array.from(orgNames).slice(0, 10) });
    }

    const mitUrl = `${MIT_BASE}?search=${encodeURIComponent(query)}&rows=5&start=0`;

    // org search: fetch ALL pages via pagination
    let rawDocs: Record<string, unknown>[];
    let mitData: unknown;
    if (isOrgSearch) {
      [rawDocs, mitData] = await Promise.all([fetchAllOrgDocs(query), fetchJson(mitUrl)]);
    } else {
      const vriUrl = buildVriUrl(`*${query}*`, 10);
      const [vriData, mitDataResult] = await Promise.all([fetchJson(vriUrl), fetchJson(mitUrl)]);
      rawDocs = getVriDocs(vriData);
      mitData = mitDataResult;
    }

    const filteredDocs = rawDocs; // org_title field already filtered by Solr

    const vriItems = filteredDocs
      .map(parseVriDoc)
      .filter((i) => i.miName || i.miSerialNumber || i.miRegestryNumber);

    // MIT (type registry) — eapi still works for type lookups
    const mitRaw = (mitData as { result?: { items?: Record<string, unknown>[] } } | null)?.result?.items || [];
    const mitItems = mitRaw.map((item) => {
      const mitId = (item["mit_id"] as string) || (item["id"] as string) || "";
      return {
        miName: (item["mit_title"] as string) || (item["title"] as string) || "",
        miType: (item["mit_notation"] as string) || (item["notation"] as string) || "",
        miManufacturer: (item["mit_manufacturer"] as string) || (item["manufacturer"] as string) || "",
        miSerialNumber: "",
        miRegestryNumber: (item["mit_number"] as string) || (item["number"] as string) || query,
        orgTitle: "",
        validDate: "",
        vriDate: "",
        arshinUrl: mitId ? `https://fgis.gost.ru/fundmetrology/cm/mit/${mitId}` : "",
        source: "mit" as const,
      };
    }).filter((i) => i.miName || i.miRegestryNumber);

    // Org search: skip MIT results (not relevant for equipment lists)
    const items = isOrgSearch ? vriItems : [...vriItems, ...mitItems];

    return NextResponse.json({ items, total: items.length });
  } catch (e: unknown) {
    if (e instanceof Error && e.name === "TimeoutError") {
      return NextResponse.json({ error: "Таймаут запроса к Аршин" }, { status: 504 });
    }
    console.error("Arshin proxy error:", e);
    return NextResponse.json({ error: "Ошибка запроса к ФГИС Аршин" }, { status: 500 });
  }
}
