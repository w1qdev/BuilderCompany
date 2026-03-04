import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { sendArshinVerificationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

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
// Body: { all: true }      — check all equipment with serialNumber
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
      serialNumber: { not: null },
    };

    if (ids?.length) {
      where.id = { in: ids };
    } else if (checkAll) {
      // Only recheck if never checked or stale
      where.AND = [
        {
          OR: [
            { arshinCheckedAt: null },
            { arshinCheckedAt: { lt: staleThreshold } },
          ],
        },
        { serialNumber: { not: null } },
      ];
      delete where.serialNumber;
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

    // Filter equipment that actually needs checking
    const toCheck = equipment.filter((eq) => {
      if (!eq.serialNumber) return false;
      if (!ids?.length && eq.arshinCheckedAt && eq.arshinCheckedAt > staleThreshold) return false;
      return true;
    });

    // Process in parallel batches of 5
    const BATCH_SIZE = 5;
    for (let i = 0; i < toCheck.length; i += BATCH_SIZE) {
      const batch = toCheck.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async (eq) => {
          const query = eq.serialNumber!;

          // Fetch VRI and MIT in parallel
          const data = await fetchArshinVri(query);
          const item = extractVriItem(data);

          const mitQuery = item?.miTypeNumber || query;
          const mitResult = await fetchMit(mitQuery);

          const arshinValidDate = item?.validDate ? new Date(item.validDate) : null;
          const arshinUrl = item?.vriId
            ? `https://fgis.gost.ru/fundmetrology/cm/results/${item.vriId}`
            : null;

          // Auto-sync: update nextVerification & verificationDate from Arshin data
          const arshinVriDate = item?.vriDate ? new Date(item.vriDate) : null;
          let autoNextVerification: Date | undefined;
          let autoVerificationDate: Date | undefined;

          if (arshinValidDate) {
            // Update nextVerification if differs by more than 3 days
            if (!eq.nextVerification || Math.abs(arshinValidDate.getTime() - eq.nextVerification.getTime()) > 3 * 24 * 60 * 60 * 1000) {
              autoNextVerification = arshinValidDate;
            }
          }
          if (arshinVriDate) {
            if (!eq.verificationDate || Math.abs(arshinVriDate.getTime() - eq.verificationDate.getTime()) > 3 * 24 * 60 * 60 * 1000) {
              autoVerificationDate = arshinVriDate;
            }
          }

          // Auto-update status based on Arshin dates
          let statusUpdate: string | undefined;
          if (arshinValidDate) {
            const now = new Date();
            if (arshinValidDate < now && eq.status !== "expired") {
              statusUpdate = "expired";
            } else if (arshinValidDate > now && eq.status === "expired") {
              statusUpdate = "active";
            }
          }

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
              arshinMismatch: false,
              arshinCheckedAt: new Date(),
              arshinUrl,
              mitApproved: mitResult.approved,
              mitUrl: mitResult.mitUrl,
              ...(autoNextVerification ? { nextVerification: autoNextVerification } : {}),
              ...(autoVerificationDate ? { verificationDate: autoVerificationDate } : {}),
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

          return { id: eq.id, mismatch: false, arshinValidDate: item?.validDate ?? null, arshinUrl };
        })
      );
      results.push(...batchResults);
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
