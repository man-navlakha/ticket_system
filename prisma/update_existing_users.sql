-- Update all existing users to ACTIVE status
-- Run this in your PostgreSQL database or Prisma Studio

UPDATE "User" 
SET status = 'ACTIVE' 
WHERE status = 'PENDING' OR status IS NULL;

-- Verify the update
SELECT id, email, name, role, status 
FROM "User" 
ORDER BY "createdAt" DESC;
