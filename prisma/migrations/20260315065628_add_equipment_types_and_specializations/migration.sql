-- CreateTable
CREATE TABLE "EquipmentType" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ExecutorSpecialization" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "executorId" INTEGER NOT NULL,
    "serviceType" TEXT NOT NULL,
    "equipmentTypeId" INTEGER NOT NULL,
    CONSTRAINT "ExecutorSpecialization_executorId_fkey" FOREIGN KEY ("executorId") REFERENCES "Executor" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExecutorSpecialization_equipmentTypeId_fkey" FOREIGN KEY ("equipmentTypeId") REFERENCES "EquipmentType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RequestItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "requestId" INTEGER NOT NULL,
    "equipmentId" INTEGER,
    "equipmentTypeId" INTEGER,
    "service" TEXT NOT NULL,
    "poverk" TEXT,
    "object" TEXT,
    "fabricNumber" TEXT,
    "registry" TEXT,
    CONSTRAINT "RequestItem_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RequestItem_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RequestItem_equipmentTypeId_fkey" FOREIGN KEY ("equipmentTypeId") REFERENCES "EquipmentType" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_RequestItem" ("equipmentId", "fabricNumber", "id", "object", "poverk", "registry", "requestId", "service") SELECT "equipmentId", "fabricNumber", "id", "object", "poverk", "registry", "requestId", "service" FROM "RequestItem";
DROP TABLE "RequestItem";
ALTER TABLE "new_RequestItem" RENAME TO "RequestItem";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "EquipmentType_name_key" ON "EquipmentType"("name");

-- CreateIndex
CREATE INDEX "ExecutorSpecialization_executorId_idx" ON "ExecutorSpecialization"("executorId");

-- CreateIndex
CREATE INDEX "ExecutorSpecialization_equipmentTypeId_idx" ON "ExecutorSpecialization"("equipmentTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "ExecutorSpecialization_executorId_serviceType_equipmentTypeId_key" ON "ExecutorSpecialization"("executorId", "serviceType", "equipmentTypeId");
