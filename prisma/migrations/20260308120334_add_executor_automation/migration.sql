-- CreateTable
CREATE TABLE "Executor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "inn" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "website" TEXT,
    "services" TEXT NOT NULL DEFAULT '[]',
    "accreditationNumber" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ExecutorRequest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "requestId" INTEGER NOT NULL,
    "executorId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "sentAt" DATETIME,
    "emailMessageId" TEXT,
    "responseEmail" TEXT,
    "invoiceFiles" TEXT NOT NULL DEFAULT '[]',
    "parsedAmount" REAL,
    "finalAmount" REAL,
    "markup" REAL,
    "clientAmount" REAL,
    "approvedAt" DATETIME,
    "clientPaidAt" DATETIME,
    "executorPaidAt" DATETIME,
    "paymentToken" TEXT,
    "paymentProofFile" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExecutorRequest_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExecutorRequest_executorId_fkey" FOREIGN KEY ("executorId") REFERENCES "Executor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ExecutorRequest_paymentToken_key" ON "ExecutorRequest"("paymentToken");

-- CreateIndex
CREATE INDEX "ExecutorRequest_requestId_idx" ON "ExecutorRequest"("requestId");

-- CreateIndex
CREATE INDEX "ExecutorRequest_executorId_idx" ON "ExecutorRequest"("executorId");

-- CreateIndex
CREATE INDEX "ExecutorRequest_paymentToken_idx" ON "ExecutorRequest"("paymentToken");

-- CreateIndex
CREATE INDEX "ExecutorRequest_status_idx" ON "ExecutorRequest"("status");
