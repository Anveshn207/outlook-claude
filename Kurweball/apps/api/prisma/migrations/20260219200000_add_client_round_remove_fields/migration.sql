-- AlterTable: add clientRound, drop cloud, rating, notes, codingRequired
ALTER TABLE "bench_sales_submissions" ADD COLUMN "clientRound" TEXT;
ALTER TABLE "bench_sales_submissions" DROP COLUMN IF EXISTS "cloud";
ALTER TABLE "bench_sales_submissions" DROP COLUMN IF EXISTS "rating";
ALTER TABLE "bench_sales_submissions" DROP COLUMN IF EXISTS "notes";
ALTER TABLE "bench_sales_submissions" DROP COLUMN IF EXISTS "codingRequired";
