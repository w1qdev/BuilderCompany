import logger from "@/lib/logger";

/**
 * Try to extract total amount from PDF buffer.
 * Looks for Russian invoice patterns like "Итого: 10 500,00", "Сумма: 10500.00", "К оплате 10 500 руб."
 * Returns parsed number or null if not found/not confident.
 */
export async function parseInvoiceAmount(pdfBuffer: Buffer): Promise<number | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse");
    const data = await pdfParse(pdfBuffer);
    const text = data.text;

    // Patterns ordered by specificity (most specific first)
    const patterns = [
      /(?:итого|к\s*оплате|всего|сумма\s*к\s*оплате|общая\s*сумма)[:\s]*(\d[\d\s]*[.,]\d{2})/gi,
      /(?:итого|к\s*оплате|всего)[:\s]*(\d[\d\s]+)\s*(?:руб|₽|р\.)/gi,
      /(?:итого|к\s*оплате|всего)[:\s]*(\d[\d\s]*[.,]?\d*)/gi,
    ];

    for (const pattern of patterns) {
      const matches = [...text.matchAll(pattern)];
      if (matches.length > 0) {
        // Take the last match (usually the grand total)
        const lastMatch = matches[matches.length - 1];
        const rawAmount = lastMatch[1]
          .replace(/\s/g, "")
          .replace(",", ".");
        const amount = parseFloat(rawAmount);
        if (!isNaN(amount) && amount > 0 && amount < 100_000_000) {
          logger.info(`Parsed invoice amount: ${amount}`);
          return amount;
        }
      }
    }

    logger.info("Could not parse amount from PDF");
    return null;
  } catch (error) {
    logger.error("PDF parse error:", error);
    return null;
  }
}
