-- Add shareToken column (nullable + unique) and backfill existing rows.
ALTER TABLE "Ticket" ADD COLUMN "shareToken" TEXT;

-- Backfill: every existing ticket gets a unique random token.
-- gen_random_uuid() is built into Postgres 13+ — no extension needed.
-- We strip the hyphens so the token is a clean 32-char hex slug.
UPDATE "Ticket"
SET "shareToken" = replace(gen_random_uuid()::text, '-', '')
WHERE "shareToken" IS NULL;

CREATE UNIQUE INDEX "Ticket_shareToken_key" ON "Ticket"("shareToken");
