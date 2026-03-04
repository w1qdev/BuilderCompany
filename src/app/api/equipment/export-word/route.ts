import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  AlignmentType,
  WidthType,
  BorderStyle,
  VerticalAlign,
  PageOrientation,
} from "docx";

function formatDate(date: Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function cell(text: string, bold = false, alignment: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.CENTER): TableCell {
  return new TableCell({
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        alignment,
        spacing: { before: 40, after: 40 },
        children: [
          new TextRun({ text, bold, size: 20, font: "Times New Roman" }),
        ],
      }),
    ],
  });
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categoryParams = searchParams.getAll("category");
    const type = searchParams.get("type") || "si";

    const where: Record<string, unknown> = { userId };
    if (categoryParams.length === 1) {
      where.category = categoryParams[0];
    } else if (categoryParams.length > 1) {
      where.category = { in: categoryParams };
    }

    const equipment = await prisma.equipment.findMany({
      where,
      orderBy: { name: "asc" },
    });

    const currentYear = new Date().getFullYear();

    const titleText =
      type === "io"
        ? `График периодической аттестации испытательного оборудования на ${currentYear} год`
        : `График поверки средств измерений на ${currentYear} год`;

    // "УТВЕРЖДАЮ" block
    const approvalBlock = [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { after: 0 },
        children: [
          new TextRun({ text: "УТВЕРЖДАЮ", bold: true, size: 24, font: "Times New Roman" }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { after: 0 },
        children: [
          new TextRun({ text: "Директор", size: 24, font: "Times New Roman" }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { after: 0 },
        children: [
          new TextRun({ text: 'ООО "_______________"', size: 24, font: "Times New Roman" }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { after: 200 },
        children: [
          new TextRun({ text: "_________ / ________________ /", size: 24, font: "Times New Roman" }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { after: 400 },
        children: [
          new TextRun({ text: `«____» _____________ ${currentYear} г.`, size: 24, font: "Times New Roman" }),
        ],
      }),
    ];

    // Title
    const titleParagraph = new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [
        new TextRun({ text: titleText, bold: true, size: 28, font: "Times New Roman" }),
      ],
    });

    // Table header — different for SI and IO per official templates
    const headers =
      type === "io"
        ? [
            "№ п/п",
            "Наименование испытательного оборудования",
            "Зав./инвент. номер",
            "Дата последней аттестации",
            "Периодичность проведения аттестации",
            "Дата следующей аттестации",
            "Примечание",
          ]
        : [
            "№ п/п",
            "Наименование, тип, заводской (серийный) номер",
            "Периодичность поверки (межповерочный интервал)",
            "Дата последней поверки",
            "Дата следующей (очередной) поверки",
            "Сведения о поверке (результат)",
          ];
    // Wider columns for landscape A4 (usable width ~13800 DXA)
    const colWidths =
      type === "io"
        ? [700, 4000, 1500, 2000, 1300, 2000, 2300]
        : [700, 4500, 2000, 2200, 2200, 2200];

    const headerRow = new TableRow({
      tableHeader: true,
      children: headers.map(
        (h, i) =>
          new TableCell({
            width: { size: colWidths[i], type: WidthType.DXA },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 60, after: 60 },
                children: [
                  new TextRun({ text: h, bold: true, size: 20, font: "Times New Roman" }),
                ],
              }),
            ],
          })
      ),
    });

    // Data rows — different structure for SI and IO
    const dataRows = equipment.map((eq, index) => {
      if (type === "io") {
        return new TableRow({
          children: [
            cell(String(index + 1)),
            cell(eq.name, false, AlignmentType.LEFT),
            cell(eq.serialNumber || ""),
            cell(formatDate(eq.verificationDate)),
            cell(`${eq.interval} мес.`),
            cell(formatDate(eq.nextVerification)),
            cell(eq.notes || "", false, AlignmentType.LEFT),
          ],
        });
      }
      // SI: combine name, type, serial into one column
      const nameParts = [eq.name, eq.type, eq.serialNumber ? `зав. № ${eq.serialNumber}` : ""].filter(Boolean);
      return new TableRow({
        children: [
          cell(String(index + 1)),
          cell(nameParts.join(", "), false, AlignmentType.LEFT),
          cell(`${eq.interval} мес.`),
          cell(formatDate(eq.verificationDate)),
          cell(formatDate(eq.nextVerification)),
          cell("", false, AlignmentType.LEFT),
        ],
      });
    });

    const table = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [headerRow, ...dataRows],
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1 },
        bottom: { style: BorderStyle.SINGLE, size: 1 },
        left: { style: BorderStyle.SINGLE, size: 1 },
        right: { style: BorderStyle.SINGLE, size: 1 },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
        insideVertical: { style: BorderStyle.SINGLE, size: 1 },
      },
    });

    // Signature block
    const signatureBlock = [
      new Paragraph({ spacing: { before: 600 }, children: [] }),
      new Paragraph({
        spacing: { after: 0 },
        children: [
          new TextRun({ text: "Составил:", size: 24, font: "Times New Roman" }),
        ],
      }),
      new Paragraph({
        spacing: { after: 0 },
        children: [
          new TextRun({
            text: "Ответственный за метрологическое обеспечение: ________________ / ________________ /",
            size: 24,
            font: "Times New Roman",
          }),
        ],
      }),
    ];

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              size: { orientation: PageOrientation.LANDSCAPE },
              margin: { top: 720, bottom: 720, left: 1134, right: 567 },
            },
          },
          children: [...approvalBlock, titleParagraph, table, ...signatureBlock],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const uint8 = new Uint8Array(buffer);
    const fileName =
      type === "io"
        ? `График_аттестации_ИО_${currentYear}`
        : `График_поверки_СИ_${currentYear}`;

    return new NextResponse(uint8, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(`${fileName}.docx`)}`,
      },
    });
  } catch (error) {
    console.error("Export Word error:", error);
    return NextResponse.json({ error: "Ошибка при экспорте" }, { status: 500 });
  }
}
