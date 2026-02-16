import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { JWT_SECRET } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const VRI_BASE = "https://fgis.gost.ru/fundmetrology/cm/xcdb/vri/select";
const VRI_FIELDS = "vri_id,org_title,mi.mitnumber,mi.mititle,mi.mitype,mi.modification,mi.number,verification_date,valid_date";

interface VriDoc {
  vri_id?: string;
  "mi.mititle"?: string;
  "mi.mitype"?: string;
  "mi.modification"?: string;
  "mi.number"?: string;
  "mi.mitnumber"?: string;
  org_title?: string;
  valid_date?: string;
  verification_date?: string;
}

interface VriItem {
  equipmentId: number;
  equipmentName: string;
  serialNumber: string | null;
  registryNumber: string | null;
  miName: string;
  miType: string;
  miSerialNumber: string;
  miRegistryNumber: string;
  orgTitle: string;
  vriDate: string;
  validDate: string;
  arshinUrl: string;
  isExpired: boolean;
}

async function fetchVriBySerial(serial: string): Promise<VriDoc[]> {
  const fl = encodeURIComponent(VRI_FIELDS);
  const fq = encodeURIComponent(`*${serial}*`).replace(/%2A/gi, "*");
  const url = `${VRI_BASE}?fq=${fq}&q=*&fl=${fl}&rows=20&start=0`;
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.response?.docs as VriDoc[]) || [];
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;
    if (!token) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as number;

    // Get user's SI equipment with serial/registry numbers
    const userEquipment = await prisma.equipment.findMany({
      where: {
        userId,
        category: { in: ["verification", "calibration"] },
        OR: [
          { serialNumber: { not: null } },
          { registryNumber: { not: null } },
        ],
      },
      select: {
        id: true,
        name: true,
        serialNumber: true,
        registryNumber: true,
      },
    });

    if (userEquipment.length === 0) {
      return NextResponse.json({ items: [], total: 0 });
    }

    // Fetch Arshin data for each equipment (limit concurrency to 5 at a time)
    const results: VriItem[] = [];
    const batchSize = 5;

    for (let i = 0; i < userEquipment.length; i += batchSize) {
      const batch = userEquipment.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (eq) => {
          const query = eq.serialNumber || eq.registryNumber;
          if (!query) return [];
          const docs = await fetchVriBySerial(query);
          return docs
            .filter((d) => d.verification_date)
            .map((d): VriItem => {
              const vriId = d.vri_id || "";
              const validDate = d.valid_date || "";
              return {
                equipmentId: eq.id,
                equipmentName: eq.name,
                serialNumber: eq.serialNumber,
                registryNumber: eq.registryNumber,
                miName: d["mi.mititle"] || eq.name,
                miType: d["mi.mitype"] || d["mi.modification"] || "",
                miSerialNumber: d["mi.number"] || eq.serialNumber || "",
                miRegistryNumber: d["mi.mitnumber"] || eq.registryNumber || "",
                orgTitle: d.org_title || "",
                vriDate: d.verification_date || "",
                validDate,
                arshinUrl: vriId ? `https://fgis.gost.ru/fundmetrology/cm/results/${vriId}` : "",
                isExpired: validDate ? new Date(validDate) < new Date() : false,
              };
            });
        })
      );
      results.push(...batchResults.flat());
    }

    // Sort: most recent verifications first
    results.sort((a, b) => (b.vriDate > a.vriDate ? 1 : -1));

    return NextResponse.json({ items: results, total: results.length });
  } catch (e) {
    console.error("Arshin registry error:", e);
    return NextResponse.json({ error: "Ошибка запроса" }, { status: 500 });
  }
}
