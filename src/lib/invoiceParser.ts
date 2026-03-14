import logger from "@/lib/logger";

// Patterns ordered by specificity (most specific first)
const AMOUNT_PATTERNS = [
  /(?:итого|к\s*оплате|всего|сумма\s*к\s*оплате|общая\s*сумма)[:\s]*(\d[\d\s]*[.,]\d{2})/gi,
  /(?:итого|к\s*оплате|всего)[:\s]*(\d[\d\s]+)\s*(?:руб|₽|р\.)/gi,
  /(?:стоимость|цена|оплата|сумма)[:\s]*(\d[\d\s]*[.,]\d{2})\s*(?:руб|₽|р\.)?/gi,
  /(\d[\d\s]*[.,]\d{2})\s*(?:руб|₽|р\.)/gi,
  /(?:итого|к\s*оплате|всего)[:\s]*(\d[\d\s]*[.,]?\d*)/gi,
];

/**
 * Extract total amount from plain text.
 * Looks for Russian invoice patterns like "Итого: 10 500,00", "Сумма: 10500.00", "К оплате 10 500 руб."
 */
export function parseAmountFromText(text: string): number | null {
  for (const pattern of AMOUNT_PATTERNS) {
    pattern.lastIndex = 0;
    const matches = [...text.matchAll(pattern)];
    if (matches.length > 0) {
      const lastMatch = matches[matches.length - 1];
      const rawAmount = lastMatch[1]
        .replace(/\s/g, "")
        .replace(",", ".");
      const amount = parseFloat(rawAmount);
      if (!isNaN(amount) && amount > 0 && amount < 100_000_000) {
        logger.info(`Parsed amount from text: ${amount}`);
        return amount;
      }
    }
  }
  return null;
}

/**
 * Try to extract total amount from PDF buffer.
 */
export async function parseInvoiceAmount(pdfBuffer: Buffer): Promise<number | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse");
    const data = await pdfParse(pdfBuffer);
    return parseAmountFromText(data.text);
  } catch (error) {
    logger.error("PDF parse error:", error);
    return null;
  }
}
