-- CreateTable
CREATE TABLE "CommonProblem" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommonProblem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommonProblem_label_key" ON "CommonProblem"("label");

-- CreateIndex
CREATE INDEX "CommonProblem_active_sortOrder_idx" ON "CommonProblem"("active", "sortOrder");
