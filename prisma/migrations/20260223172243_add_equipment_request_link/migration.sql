-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RequestItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "requestId" INTEGER NOT NULL,
    "equipmentId" INTEGER,
    "service" TEXT NOT NULL,
    "poverk" TEXT,
    "object" TEXT,
    "fabricNumber" TEXT,
    "registry" TEXT,
    CONSTRAINT "RequestItem_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RequestItem_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_RequestItem" ("fabricNumber", "id", "object", "poverk", "registry", "requestId", "service") SELECT "fabricNumber", "id", "object", "poverk", "registry", "requestId", "service" FROM "RequestItem";
DROP TABLE "RequestItem";
ALTER TABLE "new_RequestItem" RENAME TO "RequestItem";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
