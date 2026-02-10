import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const services = [
    // Category 1: Аттестация испытательного оборудования
    {
      title: "Калибровка манометров",
      description:
        "Калибровка манометров, вакуумметров и мановакуумметров всех классов точности",
      price: 1500,
      category: "1",
      image: "https://placehold.co/400x300/e8733a/white?text=Manometr",
    },
    {
      title: "Калибровка весов",
      description:
        "Калибровка лабораторных, технических и торговых весов с гирями",
      price: 2500,
      category: "1",
      image: "https://placehold.co/400x300/e8733a/white?text=Scales",
    },
    {
      title: "Калибровка термометров",
      description:
        "Калибровка контактных и бесконтактных термометров, термопар, терморезисторов",
      price: 1800,
      category: "1",
      image: "https://placehold.co/400x300/e8733a/white?text=Thermometer",
    },
    // Category 2: Поверка измерителей электрических величин
    {
      title: "Поверка счётчиков воды",
      description: "Поверка счётчиков воды без демонтажа",
      price: 800,
      category: "2",
      image: "https://placehold.co/400x300/e8733a/white?text=Water+Meter",
    },
    {
      title: "Поверка счётчиков электроэнергии",
      description: "Поверка электросчётчиков всех типов",
      price: 900,
      category: "2",
      image: "https://placehold.co/400x300/e8733a/white?text=Electric+Meter",
    },
    {
      title: "Поверка манометров",
      description:
        "Государственная поверка манометров с выдачей свидетельства о поверке",
      price: 1200,
      category: "2",
      image: "https://placehold.co/400x300/e8733a/white?text=Manometr+Check",
    },
    // Category 3: Поверка систем испытательных
    {
      title: "Аттестация продукции",
      description:
        "Оформление сертификатов соответствия ГОСТ Р, ТР ТС для продукции",
      price: 15000,
      category: "3",
      image: "https://placehold.co/400x300/e8733a/white?text=Certification",
    },
    {
      title: "Декларирование",
      description: "Регистрация деклараций о соответствии в едином реестре ФСА",
      price: 12000,
      category: "3",
      image: "https://placehold.co/400x300/e8733a/white?text=Declaration",
    },
    {
      title: "Сертификация ISO",
      description:
        "Сертификация систем менеджмента качества ISO 9001, 14001, 45001",
      price: 35000,
      category: "3",
      image: "https://placehold.co/400x300/e8733a/white?text=ISO",
    },
    // Category 4: Поверка средств измерений
    {
      title: "Поверка весов",
      description:
        "Периодическая и первичная поверка весоизмерительного оборудования",
      price: 2000,
      category: "4",
      image: "https://placehold.co/400x300/e8733a/white?text=Scale+Check",
    },
    {
      title: "Поверка термометров",
      description: "Поверка медицинских, лабораторных и промышленных термометров",
      price: 1000,
      category: "4",
      image: "https://placehold.co/400x300/e8733a/white?text=Temp+Check",
    },
    {
      title: "Поверка уровнемеров",
      description: "Поверка уровнемеров жидкости и сыпучих материалов",
      price: 1500,
      category: "4",
      image: "https://placehold.co/400x300/e8733a/white?text=Level+Meter",
    },
    // Category 5: Калибровка средств измерений
    {
      title: "Калибровка расходомеров",
      description: "Калибровка расходомеров газа и жидкости",
      price: 3000,
      category: "5",
      image: "https://placehold.co/400x300/e8733a/white?text=Flow+Meter",
    },
    {
      title: "Калибровка барометров",
      description: "Калибровка барометров и датчиков давления",
      price: 1700,
      category: "5",
      image: "https://placehold.co/400x300/e8733a/white?text=Barometer",
    },
    {
      title: "Калибровка pH-метров",
      description: "Калибровка pH-метров и анализаторов",
      price: 2200,
      category: "5",
      image: "https://placehold.co/400x300/e8733a/white?text=pH+Meter",
    },
  ];

  for (const service of services) {
    await prisma.service.create({
      data: service,
    });
  }

  console.log(`Created ${services.length} services`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
