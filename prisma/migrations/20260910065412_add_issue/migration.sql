-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('SUBMITTED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'REOPENED');

-- CreateTable
CREATE TABLE "Issue" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "addressLabel" TEXT NOT NULL,
    "status" "IssueStatus" NOT NULL DEFAULT 'SUBMITTED',
    "categoryId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Issue_status_createdAt_idx" ON "Issue"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Issue_categoryId_idx" ON "Issue"("categoryId");

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
