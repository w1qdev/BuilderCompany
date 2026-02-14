-- CreateTable
CREATE TABLE "RequestFile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "requestId" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    CONSTRAINT "RequestFile_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
