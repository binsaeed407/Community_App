-- Order the append-only status history by a database-assigned sequence rather
-- than by createdAt.
--
-- Sorting by a timestamp is wrong for a log: two rows can share one, and the
-- order then depends on how the database happens to return ties. SERIAL is
-- monotonic, cannot tie, and does not depend on the clock.

-- AlterTable
ALTER TABLE "IssueStatusHistory" ADD COLUMN "sequence" SERIAL NOT NULL;

-- DropIndex
DROP INDEX "IssueStatusHistory_issueId_createdAt_idx";

-- CreateIndex
CREATE UNIQUE INDEX "IssueStatusHistory_sequence_key" ON "IssueStatusHistory"("sequence");

-- CreateIndex
CREATE INDEX "IssueStatusHistory_issueId_sequence_idx" ON "IssueStatusHistory"("issueId", "sequence");
