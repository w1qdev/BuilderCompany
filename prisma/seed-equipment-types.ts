import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const equipmentTypes = [
  // Средства измерения давления
  { name: "Манометры", category: "Давление" },
  { name: "Вакуумметры", category: "Давление" },
  { name: "Датчики давления", category: "Давление" },

  // Средства измерения массы
  { name: "Весы", category: "Масса" },
  { name: "Гири", category: "Масса" },

  // Средства измерения температуры
  { name: "Термометры", category: "Температура" },
  { name: "Термопары", category: "Температура" },
  { name: "Пирометры", category: "Температура" },

  // Электрические измерения
  { name: "Мультиметры", category: "Электрические" },
  { name: "Осциллографы", category: "Электрические" },
  { name: "Вольтметры", category: "Электрические" },
  { name: "Амперметры", category: "Электрические" },
  { name: "Частотомеры", category: "Электрические" },
  { name: "Генераторы сигналов", category: "Электрические" },

  // Испытательное оборудование
  { name: "Камеры тепла/холода", category: "Испытательное оборудование" },
  { name: "Барокамеры", category: "Испытательное оборудование" },
  { name: "Вибростенды", category: "Испытательное оборудование" },

  // Геометрические измерения
  { name: "Линейки", category: "Геометрические" },
  { name: "Штангенциркули", category: "Геометрические" },
  { name: "Микрометры", category: "Геометрические" },
  { name: "Нутромеры", category: "Геометрические" },

  // Расход и объём
  { name: "Расходомеры", category: "Расход" },
  { name: "Уровнемеры", category: "Расход" },
  { name: "Счётчики газа", category: "Расход" },
  { name: "Счётчики воды", category: "Расход" },
];

async function main() {
  console.log("Seeding equipment types...");

  for (const et of equipmentTypes) {
    await prisma.equipmentType.upsert({
      where: { name: et.name },
      update: { category: et.category },
      create: et,
    });
  }

  const count = await prisma.equipmentType.count();
  console.log(`Done. Total equipment types: ${count}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
