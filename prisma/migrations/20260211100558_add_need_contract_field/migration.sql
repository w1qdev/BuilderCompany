-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Request" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
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
    CONSTRAINT "Request_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Request" ("adminNotes", "clientPrice", "createdAt", "email", "executorPrice", "fabricNumber", "fileName", "filePath", "id", "markup", "message", "name", "object", "phone", "poverk", "registry", "service", "status", "userId") SELECT "adminNotes", "clientPrice", "createdAt", "email", "executorPrice", "fabricNumber", "fileName", "filePath", "id", "markup", "message", "name", "object", "phone", "poverk", "registry", "service", "status", "userId" FROM "Request";
DROP TABLE "Request";
ALTER TABLE "new_Request" RENAME TO "Request";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
