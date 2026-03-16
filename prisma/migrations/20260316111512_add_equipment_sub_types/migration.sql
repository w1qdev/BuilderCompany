-- CreateTable
CREATE TABLE "EquipmentSubType" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "equipmentTypeId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EquipmentSubType_equipmentTypeId_fkey" FOREIGN KEY ("equipmentTypeId") REFERENCES "EquipmentType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "EquipmentSubType_equipmentTypeId_idx" ON "EquipmentSubType"("equipmentTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "EquipmentSubType_name_equipmentTypeId_key" ON "EquipmentSubType"("name", "equipmentTypeId");
