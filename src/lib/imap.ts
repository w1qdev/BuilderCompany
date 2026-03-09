import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { prisma } from "@/lib/prisma";
import { parseInvoiceAmount } from "@/lib/invoiceParser";
import { getIO } from "@/lib/socket";
import logger from "@/lib/logger";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

function getImapConfig() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return { host, port: 993, user, pass };
}

/**
 * Match incoming email to an ExecutorRequest.
 * Strategy 1: Parse [CSM-{requestId}-{executorRequestId}] from subject
 * Strategy 2: Match sender email to Executor → find active awaiting_response
 */
async function matchEmail(
  subject: string,
  senderEmail: string
): Promise<{ executorRequestId: number } | null> {
  // Strategy 1: code in subject
  const codeMatch = subject.match(/\[CSM-(\d+)-(\d+)\]/);
  if (codeMatch) {
    const executorRequestId = parseInt(codeMatch[2]);
    const execReq = await prisma.executorRequest.findUnique({
      where: { id: executorRequestId },
    });
    if (execReq && execReq.status === "awaiting_response") {
      return { executorRequestId };
    }
  }

  // Strategy 2: sender email → Executor → active ExecutorRequest
  const executor = await prisma.executor.findFirst({
    where: { email: senderEmail.toLowerCase(), active: true },
  });
  if (executor) {
    const execReq = await prisma.executorRequest.findFirst({
      where: {
        executorId: executor.id,
        status: "awaiting_response",
      },
      orderBy: { createdAt: "desc" },
    });
    if (execReq) {
      return { executorRequestId: execReq.id };
    }
  }

  return null;
}

export async function pollIncomingEmails(): Promise<void> {
  const config = getImapConfig();
  if (!config) {
    return;
  }

  // Check if IMAP polling is enabled in settings
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: "imapEnabled" },
    });
    if (setting && setting.value !== "true") {
      return;
    }
  } catch {
    // If setting doesn't exist, default to enabled
  }

  const client = new ImapFlow({
    host: config.host,
    port: config.port,
    secure: true,
    auth: { user: config.user, pass: config.pass },
    logger: false,
  });

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");

    try {
      const messages = client.fetch({ seen: false }, {
        source: true,
        envelope: true,
        uid: true,
      });

      for await (const msg of messages) {
        try {
          if (!msg.source) continue;
          const parsed = await simpleParser(msg.source);
          const subject = parsed.subject || "";
          const senderEmail = parsed.from?.value?.[0]?.address || "";

          const match = await matchEmail(subject, senderEmail);
          if (!match) {
            // Mark as seen and skip
            await client.messageFlagsAdd({ uid: msg.uid }, ["\\Seen"], { uid: true });
            continue;
          }

          // Save attachments
          const invoiceDir = path.join(
            process.cwd(),
            "uploads",
            "invoices",
            String(match.executorRequestId)
          );
          await mkdir(invoiceDir, { recursive: true });
          const savedFiles: string[] = [];
          let parsedAmount: number | null = null;

          if (parsed.attachments && parsed.attachments.length > 0) {
            for (const att of parsed.attachments) {
              const safeName =
                att.filename?.replace(/[^a-zA-Zа-яА-Я0-9._-]/g, "_") ||
                `attachment_${Date.now()}`;
              const filePath = path.join(invoiceDir, safeName);
              await writeFile(filePath, att.content);
              savedFiles.push(
                `invoices/${match.executorRequestId}/${safeName}`
              );

              // Try to parse PDF for amount
              if (att.contentType === "application/pdf" && !parsedAmount) {
                parsedAmount = await parseInvoiceAmount(att.content);
              }
            }
          }

          // Update ExecutorRequest
          const newStatus = parsedAmount
            ? "invoice_parsed"
            : "response_received";
          const updated = await prisma.executorRequest.update({
            where: { id: match.executorRequestId },
            data: {
              status: newStatus,
              responseEmail: parsed.text?.substring(0, 5000) || null,
              invoiceFiles: JSON.stringify(savedFiles),
              parsedAmount,
              finalAmount: parsedAmount, // Pre-fill, admin can edit
            },
            include: { request: true, executor: true },
          });

          // Emit Socket.IO notification to admin
          const io = getIO();
          if (io) {
            io.to("admin").emit("executor-response", {
              executorRequestId: updated.id,
              requestId: updated.requestId,
              executorName: updated.executor.name,
              status: newStatus,
              parsedAmount,
              hasAttachments: savedFiles.length > 0,
            });
          }

          logger.info(
            `IMAP: matched email to ExecutorRequest #${match.executorRequestId}, status → ${newStatus}`
          );

          // Mark as seen
          await client.messageFlagsAdd({ uid: msg.uid }, ["\\Seen"], {
            uid: true,
          });
        } catch (msgError) {
          logger.error("IMAP: error processing message:", msgError);
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();
  } catch (error) {
    logger.error("IMAP polling error:", error);
    try {
      await client.logout();
    } catch {
      /* ignore */
    }
  }
}
