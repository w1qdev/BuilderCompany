-- CreateIndex
CREATE INDEX "Request_status_idx" ON "Request"("status");

-- CreateIndex
CREATE INDEX "Request_userId_idx" ON "Request"("userId");

-- CreateIndex
CREATE INDEX "Request_createdAt_idx" ON "Request"("createdAt");
