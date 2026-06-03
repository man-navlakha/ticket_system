/*
  Warnings:

  - You are about to drop the column `components` on the `InventoryItem` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "Condition" AS ENUM ('NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR');

-- CreateEnum
CREATE TYPE "VendorStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ItemType" ADD VALUE 'DESKTOP';
ALTER TYPE "ItemType" ADD VALUE 'MOBILE';
ALTER TYPE "ItemType" ADD VALUE 'TABLET';
ALTER TYPE "ItemType" ADD VALUE 'PERIPHERAL';
ALTER TYPE "ItemType" ADD VALUE 'PRINTER';
ALTER TYPE "ItemType" ADD VALUE 'MONITOR';
ALTER TYPE "ItemType" ADD VALUE 'MOUSE';
ALTER TYPE "ItemType" ADD VALUE 'KEYBOARD';
ALTER TYPE "ItemType" ADD VALUE 'HEADSET';

-- AlterTable
ALTER TABLE "InventoryItem" DROP COLUMN "components",
ADD COLUMN     "assignedUser" TEXT,
ADD COLUMN     "condition" "Condition" NOT NULL DEFAULT 'GOOD',
ADD COLUMN     "department" TEXT,
ADD COLUMN     "graphicsCard" TEXT,
ADD COLUMN     "hasCharger" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "hasMouse" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "note" TEXT,
ADD COLUMN     "oldTag" TEXT,
ADD COLUMN     "oldUser" TEXT,
ADD COLUMN     "os" TEXT,
ADD COLUMN     "password" TEXT,
ADD COLUMN     "processor" TEXT,
ADD COLUMN     "ram" TEXT,
ADD COLUMN     "serialNumber" TEXT,
ADD COLUMN     "storage" TEXT,
ADD COLUMN     "systemSpecs" JSONB,
ADD COLUMN     "vendorInvoice" TEXT,
ALTER COLUMN "type" SET DEFAULT 'LAPTOP',
ALTER COLUMN "ownership" SET DEFAULT 'COMPANY';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "department" TEXT,
ADD COLUMN     "location" TEXT;

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ProposalStatus" NOT NULL DEFAULT 'PENDING',
    "createdById" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "adminComment" TEXT,
    "inventoryItemId" TEXT,
    "ticketId" TEXT,
    "vendors" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemReport" (
    "id" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "tagNumber" TEXT NOT NULL,
    "userName" TEXT,
    "reportDate" TEXT,
    "systemName" TEXT,
    "manufacturer" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "processor" TEXT,
    "totalRamGB" DOUBLE PRECISION,
    "windowsEdition" TEXT,
    "windowsVersion" TEXT,
    "buildNumber" TEXT,
    "licenseStatus" TEXT,
    "officeLicense" TEXT,
    "batteryHealth" TEXT,
    "batteryRating" TEXT,
    "ramDetails" JSONB,
    "gpuDetails" JSONB,
    "diskDetails" JSONB,
    "installedSoftware" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessRequest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccessRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "contactName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "address" TEXT,
    "gstin" TEXT,
    "note" TEXT,
    "status" "VendorStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalPayment" (
    "id" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RentalPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "SystemReport_inventoryItemId_key" ON "SystemReport"("inventoryItemId");

-- CreateIndex
CREATE UNIQUE INDEX "AccessRequest_email_key" ON "AccessRequest"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_name_key" ON "Vendor"("name");

-- CreateIndex
CREATE INDEX "RentalPayment_inventoryItemId_idx" ON "RentalPayment"("inventoryItemId");

-- CreateIndex
CREATE UNIQUE INDEX "RentalPayment_inventoryItemId_month_year_key" ON "RentalPayment"("inventoryItemId", "month", "year");

-- CreateIndex
CREATE INDEX "RateLimit_expiresAt_idx" ON "RateLimit"("expiresAt");

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemReport" ADD CONSTRAINT "SystemReport_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalPayment" ADD CONSTRAINT "RentalPayment_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
