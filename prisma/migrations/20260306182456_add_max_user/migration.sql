-- CreateTable
CREATE TABLE "MaxUser" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "maxUserId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MaxUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MaxLinkCode" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MaxLinkCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "MaxUser_maxUserId_key" ON "MaxUser"("maxUserId");

-- CreateIndex
CREATE INDEX "MaxUser_userId_idx" ON "MaxUser"("userId");

-- CreateIndex
CREATE INDEX "MaxLinkCode_userId_idx" ON "MaxLinkCode"("userId");

-- CreateIndex
CREATE INDEX "MaxLinkCode_code_idx" ON "MaxLinkCode"("code");
