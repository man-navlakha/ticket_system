-- Assign an email-signature page to each user (nullable).
ALTER TABLE "User" ADD COLUMN "signatureSlug" TEXT;
