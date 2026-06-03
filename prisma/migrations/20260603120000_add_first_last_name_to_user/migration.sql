-- Add structured first/last name columns to User.
-- Both nullable so the change is non-breaking; the `username` column stays
-- in place as a back-compat / display fallback.

ALTER TABLE "User" ADD COLUMN "firstName" TEXT;
ALTER TABLE "User" ADD COLUMN "lastName" TEXT;
