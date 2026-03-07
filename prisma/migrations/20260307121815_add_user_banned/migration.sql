-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "inn" TEXT,
    "kpp" TEXT,
    "legalName" TEXT,
    "legalAddress" TEXT,
    "avatar" TEXT,
    "coverImage" TEXT,
    "banned" BOOLEAN NOT NULL DEFAULT false,
    "position" TEXT,
    "timezone" TEXT DEFAULT 'Europe/Moscow',
    "notifyDays" TEXT DEFAULT '14,7',
    "telegramChatId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("avatar", "company", "coverImage", "createdAt", "email", "id", "inn", "kpp", "legalAddress", "legalName", "name", "notifyDays", "password", "phone", "position", "telegramChatId", "timezone") SELECT "avatar", "company", "coverImage", "createdAt", "email", "id", "inn", "kpp", "legalAddress", "legalName", "name", "notifyDays", "password", "phone", "position", "telegramChatId", "timezone" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
