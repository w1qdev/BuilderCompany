-- CreateTable
CREATE TABLE "Organization" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "inn" TEXT,
    "kpp" TEXT,
    "address" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "OrganizationMember" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Equipment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "organizationId" INTEGER,
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
    CONSTRAINT "Equipment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Equipment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Equipment" ("arshinCheckedAt", "arshinMismatch", "arshinNotifiedDate", "arshinUrl", "arshinValidDate", "category", "company", "contactEmail", "createdAt", "id", "ignored", "interval", "mitApproved", "mitUrl", "name", "nextVerification", "notes", "notified", "pinned", "registryNumber", "serialNumber", "status", "type", "updatedAt", "userId", "verificationDate") SELECT "arshinCheckedAt", "arshinMismatch", "arshinNotifiedDate", "arshinUrl", "arshinValidDate", "category", "company", "contactEmail", "createdAt", "id", "ignored", "interval", "mitApproved", "mitUrl", "name", "nextVerification", "notes", "notified", "pinned", "registryNumber", "serialNumber", "status", "type", "updatedAt", "userId", "verificationDate" FROM "Equipment";
DROP TABLE "Equipment";
ALTER TABLE "new_Equipment" RENAME TO "Equipment";
CREATE INDEX "Equipment_userId_idx" ON "Equipment"("userId");
CREATE INDEX "Equipment_nextVerification_idx" ON "Equipment"("nextVerification");
CREATE INDEX "Equipment_status_idx" ON "Equipment"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "OrganizationMember_organizationId_idx" ON "OrganizationMember"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_userId_organizationId_key" ON "OrganizationMember"("userId", "organizationId");
