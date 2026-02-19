-- AlterTable
ALTER TABLE "candidates" ADD COLUMN     "applicantId" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "resumeAvailable" TEXT,
ADD COLUMN     "state" TEXT;
