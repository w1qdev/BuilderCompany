import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";

export const dynamic = "force-dynamic";

const PAGES = [
  { title: "Обзор", href: "/dashboard", keywords: "обзор главная dashboard" },
  { title: "Оборудование СИ", href: "/dashboard/equipment/si", keywords: "средства измерений оборудование си" },
  { title: "Оборудование ИО", href: "/dashboard/equipment/io", keywords: "испытательное оборудование ио" },
  { title: "График поверки СИ", href: "/dashboard/schedule/si", keywords: "график поверки расписание" },
  { title: "График аттестации ИО", href: "/dashboard/schedule/io", keywords: "график аттестации расписание" },
  { title: "Мои заявки", href: "/dashboard/requests", keywords: "заявки запросы" },
  { title: "Аналитика", href: "/dashboard/analytics", keywords: "аналитика статистика" },
  { title: "Уведомления", href: "/dashboard/notifications", keywords: "уведомления настройки напоминания" },
  { title: "Профиль", href: "/dashboard/profile", keywords: "профиль настройки аккаунт" },
  { title: "Калькулятор", href: "/dashboard/calculator", keywords: "калькулятор расчёт" },
  { title: "Конвертер единиц", href: "/dashboard/converter", keywords: "конвертер единицы перевод" },
  { title: "Классы точности", href: "/dashboard/accuracy", keywords: "классы точности" },
  { title: "Справочник ГОСТов", href: "/dashboard/gosts", keywords: "гост стандарт" },
];

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim().toLowerCase();

    if (!q) {
      return NextResponse.json({ equipment: [], requests: [], pages: [] });
    }

    // Search static pages
    const pages = PAGES.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.keywords.toLowerCase().includes(q)
    );

    // Search equipment and requests in parallel
    const [equipment, requests] = await Promise.all([
      prisma.equipment.findMany({
        where: {
          userId,
          ignored: false,
          OR: [
            { name: { contains: q } },
            { serialNumber: { contains: q } },
            { type: { contains: q } },
          ],
        },
        select: {
          id: true,
          name: true,
          serialNumber: true,
          type: true,
          category: true,
          status: true,
        },
        take: 5,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.request.findMany({
        where: {
          userId,
          service: { contains: q },
        },
        select: {
          id: true,
          service: true,
          status: true,
          createdAt: true,
        },
        take: 5,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({ equipment, requests, pages });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Ошибка поиска" }, { status: 500 });
  }
}
