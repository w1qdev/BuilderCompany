import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { verifyAdminPassword } from "@/lib/adminAuth";
import { JWT_SECRET } from "@/lib/jwt";

const MIME_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const fileName = segments.join("/");

  // Resolve and validate path stays inside uploads/
  const uploadsDir = path.resolve(process.cwd(), "uploads");
  const filePath = path.resolve(uploadsDir, fileName);
  const relative = path.relative(uploadsDir, filePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!existsSync(filePath)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // 1) Admin via x-admin-password header
  const adminPass = req.headers.get("x-admin-password");
  if (adminPass && (await verifyAdminPassword(adminPass))) {
    return serveFile(filePath, fileName);
  }

  // 2) Authenticated owner via JWT cookie
  const token = req.cookies.get("auth-token")?.value;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const userId = payload.userId as number;
      const owns = await prisma.request.findFirst({
        where: { filePath: `/api/uploads/${fileName}`, userId },
        select: { id: true },
      });
      if (owns) {
        return serveFile(filePath, fileName);
      }
    } catch {
      // invalid token — fall through to 403
    }
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

async function serveFile(absolutePath: string, fileName: string) {
  const ext = path.extname(fileName).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  const buffer = await readFile(absolutePath);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${path.basename(fileName)}"`,
    },
  });
}
