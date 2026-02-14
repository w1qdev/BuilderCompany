import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import { JWT_SECRET } from "@/lib/jwt";
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
} from "docx";

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

    // Table header
    const headers = [
      "№ п/п",
      "Наименование",
      "Зав. номер",
      "Дата последней поверки (аттестации)",
      "Периодичность (мес.)",
      "Дата следующей поверки (аттестации)",
      "Примечание",
    ];
    const colWidths = [700, 2800, 1200, 1600, 1100, 1600, 1500];

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

    // Data rows
    const dataRows = equipment.map(
      (eq, index) =>
        new TableRow({
          children: [
            cell(String(index + 1)),
            cell(eq.name, false, AlignmentType.LEFT),
            cell(eq.serialNumber || ""),
            cell(formatDate(eq.verificationDate)),
            cell(String(eq.interval)),
            cell(formatDate(eq.nextVerification)),
            cell(eq.notes || "", false, AlignmentType.LEFT),
          ],
        })
    );

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
