-- Delete personal equipment (no organization)
DELETE FROM "Equipment" WHERE "organizationId" IS NULL;

-- Delete orphaned verification records
DELETE FROM "VerificationRecord" WHERE "equipmentId" NOT IN (SELECT "id" FROM "Equipment");

-- Delete orphaned request items pointing to deleted equipment
UPDATE "RequestItem" SET "equipmentId" = NULL WHERE "equipmentId" IS NOT NULL AND "equipmentId" NOT IN (SELECT "id" FROM "Equipment");

-- Recreate table with required organizationId (SQLite doesn't support ALTER COLUMN)
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Equipment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "serialNumber" TEXT,
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
    CONSTRAINT "Equipment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Equipment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_Equipment" SELECT * FROM "Equipment";
DROP TABLE "Equipment";
ALTER TABLE "new_Equipment" RENAME TO "Equipment";

CREATE INDEX "Equipment_userId_idx" ON "Equipment"("userId");
CREATE INDEX "Equipment_nextVerification_idx" ON "Equipment"("nextVerification");
CREATE INDEX "Equipment_status_idx" ON "Equipment"("status");

PRAGMA foreign_keys=ON;
