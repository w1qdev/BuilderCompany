-- CreateTable
CREATE TABLE "RequestItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "requestId" INTEGER NOT NULL,
    "service" TEXT NOT NULL,
    "poverk" TEXT,
    "object" TEXT,
    "fabricNumber" TEXT,
    "registry" TEXT,
    CONSTRAINT "RequestItem_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
