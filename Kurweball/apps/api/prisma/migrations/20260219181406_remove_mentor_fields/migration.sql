/*
  Warnings:

  - You are about to drop the column `mentorsEmail` on the `bench_sales_submissions` table. All the data in the column will be lost.
  - You are about to drop the column `mentorsReview` on the `bench_sales_submissions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "bench_sales_submissions" DROP COLUMN "mentorsEmail",
DROP COLUMN "mentorsReview";
