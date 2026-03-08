/*
  Warnings:

  - You are about to drop the column `assignee` on the `Request` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Staff" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'staff',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Request" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT,
    "inn" TEXT,
    "service" TEXT NOT NULL,
    "object" TEXT,
    "fabricNumber" TEXT,
    "registry" TEXT,
    "poverk" TEXT,
    "message" TEXT,
    "fileName" TEXT,
    "filePath" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,
    "adminNotes" TEXT,
    "executorPrice" REAL,
    "markup" REAL,
    "clientPrice" REAL,
    "needContract" BOOLEAN NOT NULL DEFAULT false,
    "assigneeId" INTEGER,
    CONSTRAINT "Request_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Request_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "Staff" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Request" ("adminNotes", "clientPrice", "company", "createdAt", "email", "executorPrice", "fabricNumber", "fileName", "filePath", "id", "inn", "markup", "message", "name", "needContract", "object", "phone", "poverk", "registry", "service", "status", "userId") SELECT "adminNotes", "clientPrice", "company", "createdAt", "email", "executorPrice", "fabricNumber", "fileName", "filePath", "id", "inn", "markup", "message", "name", "needContract", "object", "phone", "poverk", "registry", "service", "status", "userId" FROM "Request";
DROP TABLE "Request";
ALTER TABLE "new_Request" RENAME TO "Request";
CREATE INDEX "Request_status_idx" ON "Request"("status");
CREATE INDEX "Request_userId_idx" ON "Request"("userId");
CREATE INDEX "Request_createdAt_idx" ON "Request"("createdAt");
CREATE INDEX "Request_assigneeId_idx" ON "Request"("assigneeId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Staff_login_key" ON "Staff"("login");
