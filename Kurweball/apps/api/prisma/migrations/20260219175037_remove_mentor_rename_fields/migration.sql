/*
  Warnings:

  - You are about to drop the column `mentor` on the `bench_sales_submissions` table. All the data in the column will be lost.
  - You are about to drop the column `mentorEmail` on the `bench_sales_submissions` table. All the data in the column will be lost.
  - You are about to drop the column `mentorReview` on the `bench_sales_submissions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "bench_sales_submissions" DROP COLUMN "mentor",
DROP COLUMN "mentorEmail",
DROP COLUMN "mentorReview",
ADD COLUMN     "mentorsEmail" TEXT,
ADD COLUMN     "mentorsReview" TEXT;
