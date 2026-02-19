-- CreateTable
CREATE TABLE "bench_sales_submissions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT,
    "mentor" TEXT,
    "consultant" TEXT NOT NULL,
    "vendor" TEXT,
    "client" TEXT,
    "jobDuties" TEXT,
    "recruiter" TEXT,
    "batch" TEXT,
    "position" TEXT,
    "resume" TEXT,
    "cloud" TEXT,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "interviewKind" TEXT,
    "rating" TEXT,
    "mentorReview" TEXT,
    "status" TEXT,
    "interviewType" TEXT,
    "comments" TEXT,
    "duration" TEXT,
    "submissionBy" TEXT,
    "uniqueSubmissionId" TEXT,
    "codingRequired" TEXT,
    "interviewerName" TEXT,
    "notes" TEXT,
    "vendorEmail" TEXT,
    "vendorPhone" TEXT,
    "projectDuration" TEXT,
    "submissionType" TEXT,
    "mentorEmail" TEXT,
    "vendorContactName" TEXT,
    "billingRate" TEXT,
    "workLocation" TEXT,
    "vendorScreening" TEXT,
    "submissionDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bench_sales_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bench_sales_submissions_tenantId_idx" ON "bench_sales_submissions"("tenantId");

-- CreateIndex
CREATE INDEX "bench_sales_submissions_consultant_idx" ON "bench_sales_submissions"("consultant");

-- CreateIndex
CREATE INDEX "bench_sales_submissions_status_idx" ON "bench_sales_submissions"("status");

-- CreateIndex
CREATE INDEX "bench_sales_submissions_vendor_idx" ON "bench_sales_submissions"("vendor");

-- AddForeignKey
ALTER TABLE "bench_sales_submissions" ADD CONSTRAINT "bench_sales_submissions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
