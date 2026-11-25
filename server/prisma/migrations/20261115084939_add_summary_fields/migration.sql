-- AlterTable
ALTER TABLE "Citation" ADD COLUMN     "normalized" TEXT;

-- AlterTable
ALTER TABLE "Judgment" ADD COLUMN     "language" TEXT,
ADD COLUMN     "outcome" TEXT,
ADD COLUMN     "parties" TEXT,
ADD COLUMN     "summarizedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Citation_normalized_idx" ON "Citation"("normalized");
