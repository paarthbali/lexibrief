-- AlterTable
CREATE EXTENSION IF NOT EXISTS vector;
ALTER TABLE "Judgment" ADD COLUMN     "embedding" vector(768);
