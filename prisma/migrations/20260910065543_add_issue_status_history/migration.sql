-- CreateTable
CREATE TABLE "IssueStatusHistory" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "status" "IssueStatus" NOT NULL,
    "reason" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IssueStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IssueStatusHistory_issueId_createdAt_idx" ON "IssueStatusHistory"("issueId", "createdAt");

-- AddForeignKey
ALTER TABLE "IssueStatusHistory" ADD CONSTRAINT "IssueStatusHistory_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueStatusHistory" ADD CONSTRAINT "IssueStatusHistory_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
