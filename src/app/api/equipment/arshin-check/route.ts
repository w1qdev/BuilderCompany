import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import { JWT_SECRET } from "@/lib/jwt";
import { sendArshinVerificationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

async function getUserId(request: NextRequest): Promise<number | null> {
  const token = request.cookies.get("auth-token")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.userId as number;
  } catch {
    return null;
  }
}

const RECHECK_DAYS = 7;

const VRI_SELECT = "https://fgis.gost.ru/fundmetrology/cm/xcdb/vri/select";
const VRI_FIELDS = "vri_id,mi.mititle,mi.number,mi.mitnumber,verification_date,valid_date";
const MIT_BASE = "https://fgis.gost.ru/fundmetrology/eapi/mit";

async function fetchMit(query: string): Promise<{ approved: boolean; mitUrl: string | null }> {
  try {
    const url = `${MIT_BASE}?search=${encodeURIComponent(query)}&rows=1&start=0`;
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { approved: false, mitUrl: null };
    const data = await res.json() as { result?: { items?: Record<string, unknown>[] } };
    const items = data?.result?.items || [];
    if (!items.length) return { approved: false, mitUrl: null };
    const first = items[0];
    const mitId = (first["mit_id"] as string) || (first["id"] as string) || "";
    return {
      approved: true,
      mitUrl: mitId ? `https://fgis.gost.ru/fundmetrology/cm/mit/${mitId}` : null,
    };
  } catch {
    return { approved: false, mitUrl: null };
  }
}

async function fetchArshinVri(query: string) {
  const fqEnc = encodeURIComponent(`*${query}*`).replace(/%2A/gi, "*");
  const fl = encodeURIComponent(VRI_FIELDS);
  const url = `${VRI_SELECT}?fq=${fqEnc}&q=*&fl=${fl}&rows=5&start=0`;
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    return await res.json() as Record<string, unknown>;
  } catch {
    return null;
  }
}

function extractVriItem(data: Record<string, unknown> | null) {
  const docs = (data as { response?: { docs?: Record<string, unknown>[] } } | null)?.response?.docs;
  if (!docs?.length) return null;
  const item = docs[0];
  return {
    validDate: (item["valid_date"] as string) || null,
    vriDate: (item["verification_date"] as string) || null,
    vriId: (item["vri_id"] as string) || null,
    miName: (item["mi.mititle"] as string) || "",
    miSerialNum: (item["mi.number"] as string) || "",
    miTypeNumber: (item["mi.mitnumber"] as string) || null, // тип СИ для MIT
  };
}

// POST /api/equipment/arshin-check
// Body: { ids: number[] }  — check specific equipment IDs
// Body: { all: true }      — check all equipment with serialNumber/registryNumber
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const body = await request.json();
    const ids: number[] | undefined = body.ids;
    const checkAll: boolean = body.all === true;

    const staleThreshold = new Date(Date.now() - RECHECK_DAYS * 24 * 60 * 60 * 1000);

    const where: Record<string, unknown> = {
      userId,
      OR: [
        { serialNumber: { not: null } },
        { registryNumber: { not: null } },
      ],
    };

    if (ids?.length) {
      where.id = { in: ids };
    } else if (checkAll) {
      // Only recheck if never checked or stale
      where.OR = [
        { arshinCheckedAt: null },
        { arshinCheckedAt: { lt: staleThreshold } },
        { serialNumber: { not: null } },
        { registryNumber: { not: null } },
      ];
      where.AND = [
        {
          OR: [
            { arshinCheckedAt: null },
            { arshinCheckedAt: { lt: staleThreshold } },
          ],
        },
        {
          OR: [
            { serialNumber: { not: null } },
            { registryNumber: { not: null } },
          ],
        },
      ];
      delete where.OR;
    } else {
      return NextResponse.json({ error: "Укажите ids или all:true" }, { status: 400 });
    }

    const equipment = await prisma.equipment.findMany({
      where,
      include: { user: { select: { email: true, name: true } } },
    });

    const results: { id: number; mismatch: boolean; arshinValidDate: string | null; arshinUrl: string | null }[] = [];

    // Track equipment that got a NEW valid Arshin date for email notification
    type NewVerifItem = { name: string; type: string | null; serialNumber: string | null; validDate: string; arshinUrl: string | null };
    const newVerifItems: NewVerifItem[] = [];

    for (const eq of equipment) {
      const query = eq.serialNumber || eq.registryNumber;
      if (!query) continue;

      // Skip recently checked (unless explicit ids request)
      if (!ids?.length && eq.arshinCheckedAt && eq.arshinCheckedAt > staleThreshold) {
        continue;
      }

      const data = await fetchArshinVri(query);
      const item = extractVriItem(data);

      const arshinValidDate = item?.validDate ? new Date(item.validDate) : null;
      const arshinUrl = item?.vriId
        ? `https://fgis.gost.ru/fundmetrology/cm/results/${item.vriId}`
        : null;

      // MIT check — use type registry number from VRI result, fallback to query
      const mitQuery = item?.miTypeNumber || query;
      const mitResult = await fetchMit(mitQuery);

      // Detect mismatch: arshin says expired but our DB says active/pending
      // OR arshin validDate differs from our nextVerification by more than 3 days
      let mismatch = false;
      if (arshinValidDate) {
        const now = new Date();
        if (arshinValidDate < now && (eq.status === "active" || eq.status === "pending")) {
          mismatch = true;
        } else if (eq.nextVerification) {
          const diffMs = Math.abs(arshinValidDate.getTime() - eq.nextVerification.getTime());
          const diffDays = diffMs / (1000 * 60 * 60 * 24);
          if (diffDays > 3) mismatch = true;
        }
      }

      // Auto-update status to expired if Arshin says so
      let statusUpdate: string | undefined;
      if (arshinValidDate && arshinValidDate < new Date() && eq.status !== "expired") {
        statusUpdate = "expired";
      }

      // Detect NEW verification: arshinValidDate changed and is in the future + not yet notified for this date
      const isNewVerification =
        arshinValidDate !== null &&
        arshinValidDate > new Date() &&
        (
          !eq.arshinNotifiedDate ||
          Math.abs(arshinValidDate.getTime() - eq.arshinNotifiedDate.getTime()) > 24 * 60 * 60 * 1000
        );

      await prisma.equipment.update({
        where: { id: eq.id },
        data: {
          arshinValidDate,
          arshinMismatch: mismatch,
          arshinCheckedAt: new Date(),
          arshinUrl,
          mitApproved: mitResult.approved,
          mitUrl: mitResult.mitUrl,
          ...(isNewVerification ? { arshinNotifiedDate: arshinValidDate } : {}),
          ...(statusUpdate ? { status: statusUpdate } : {}),
        },
      });

      if (isNewVerification && item?.validDate) {
        newVerifItems.push({
          name: eq.name,
          type: eq.type,
          serialNumber: eq.serialNumber,
          validDate: item.validDate,
          arshinUrl,
        });
      }

      results.push({ id: eq.id, mismatch, arshinValidDate: item?.validDate ?? null, arshinUrl });
    }

    // Send email notification for new verifications (use contactEmail or user email)
    if (newVerifItems.length > 0 && equipment.length > 0) {
      const firstEq = equipment[0];
      const notifyEmail = firstEq.contactEmail || firstEq.user?.email;
      const userName = firstEq.user?.name || "пользователь";
      if (notifyEmail) {
        sendArshinVerificationEmail({
          userName,
          email: notifyEmail,
          equipment: newVerifItems,
        }).catch(console.error);
      }
    }

    return NextResponse.json({ checked: results.length, results, newVerifications: newVerifItems.length });
  } catch (error) {
    console.error("Arshin check error:", error);
    return NextResponse.json({ error: "Ошибка проверки через Аршин" }, { status: 500 });
  }
}
