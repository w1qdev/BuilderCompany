-- AlterTable
ALTER TABLE "Request" ADD COLUMN "assignee" TEXT;

-- CreateIndex
CREATE INDEX "Request_assignee_idx" ON "Request"("assignee");
