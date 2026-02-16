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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Equipment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Equipment" ("category", "company", "contactEmail", "createdAt", "id", "interval", "name", "nextVerification", "notes", "notified", "registryNumber", "serialNumber", "status", "type", "updatedAt", "userId", "verificationDate") SELECT "category", "company", "contactEmail", "createdAt", "id", "interval", "name", "nextVerification", "notes", "notified", "registryNumber", "serialNumber", "status", "type", "updatedAt", "userId", "verificationDate" FROM "Equipment";
DROP TABLE "Equipment";
ALTER TABLE "new_Equipment" RENAME TO "Equipment";
CREATE INDEX "Equipment_userId_idx" ON "Equipment"("userId");
CREATE INDEX "Equipment_nextVerification_idx" ON "Equipment"("nextVerification");
CREATE INDEX "Equipment_status_idx" ON "Equipment"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
