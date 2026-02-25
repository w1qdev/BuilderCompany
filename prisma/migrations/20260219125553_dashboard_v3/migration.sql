-- AlterTable
ALTER TABLE "User" ADD COLUMN "telegramChatId" TEXT;

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerificationRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "equipmentId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "nextDate" DATETIME,
    "result" TEXT,
    "performer" TEXT,
    "certificate" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VerificationRecord_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Equipment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "serialNumber" TEXT,
    "registryNumber" TEXT,
    "verificationDate" DATETIME,
    "nextVerification" DATETIME,
    "interval" INTEGER NOT NULL DEFAULT 12,
    "category" TEXT NOT NULL DEFAULT 'verification',
    "status" TEXT NOT NULL DEFAULT 'active',
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "company" TEXT,
    "contactEmail" TEXT,
    "notes" TEXT,
    "arshinValidDate" DATETIME,
    "arshinMismatch" BOOLEAN NOT NULL DEFAULT false,
    "arshinCheckedAt" DATETIME,
    "arshinUrl" TEXT,
    "arshinNotifiedDate" DATETIME,
    "mitApproved" BOOLEAN,
    "mitUrl" TEXT,
    "ignored" BOOLEAN NOT NULL DEFAULT false,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Equipment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Equipment" ("arshinCheckedAt", "arshinMismatch", "arshinNotifiedDate", "arshinUrl", "arshinValidDate", "category", "company", "contactEmail", "createdAt", "id", "ignored", "interval", "mitApproved", "mitUrl", "name", "nextVerification", "notes", "notified", "registryNumber", "serialNumber", "status", "type", "updatedAt", "userId", "verificationDate") SELECT "arshinCheckedAt", "arshinMismatch", "arshinNotifiedDate", "arshinUrl", "arshinValidDate", "category", "company", "contactEmail", "createdAt", "id", "ignored", "interval", "mitApproved", "mitUrl", "name", "nextVerification", "notes", "notified", "registryNumber", "serialNumber", "status", "type", "updatedAt", "userId", "verificationDate" FROM "Equipment";
DROP TABLE "Equipment";
ALTER TABLE "new_Equipment" RENAME TO "Equipment";
CREATE INDEX "Equipment_userId_idx" ON "Equipment"("userId");
CREATE INDEX "Equipment_nextVerification_idx" ON "Equipment"("nextVerification");
CREATE INDEX "Equipment_status_idx" ON "Equipment"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- CreateIndex
CREATE INDEX "VerificationRecord_equipmentId_idx" ON "VerificationRecord"("equipmentId");
