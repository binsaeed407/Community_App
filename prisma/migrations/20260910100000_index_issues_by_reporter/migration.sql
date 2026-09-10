-- The "my reports" page filters by reporter and orders by date. Without this
-- index that is a sequential scan of every issue in the table, which is
-- invisible at fifteen rows and is the first thing to hurt at fifty thousand.
CREATE INDEX "Issue_reporterId_createdAt_idx" ON "Issue"("reporterId", "createdAt");
