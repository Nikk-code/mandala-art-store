-- CreateIndex
-- Enforce at most one default address per customer via PostgreSQL Partial Unique Index
CREATE UNIQUE INDEX "addresses_user_default_unique_idx" ON "addresses"("user_id") WHERE ("is_default" = true);
