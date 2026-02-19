/**
 * Seed script: Import All Records.csv into bench_sales_submissions table.
 * Run: node --require @swc-node/register apps/api/src/modules/bench-sales/seed-bench-sales.ts
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
  }
  result.push(current.trim());
  return result;
}

function tryParseDate(val: string): Date | null {
  if (!val) return null;
  const d = new Date(val);
  if (!isNaN(d.getTime())) return d;
  return null;
}

async function main() {
  const csvPath = path.join('C:', 'Users', 'E2 Training', 'Downloads', 'All Records.csv');
  const raw = fs.readFileSync(csvPath, 'utf-8');
  const lines = raw.split('\n');
  const headers = parseCSVLine(lines[0]);

  console.log(`[Seed] CSV headers (${headers.length}):`, headers.join(', '));

  // Map CSV header → DB field
  const headerMap: Record<string, string> = {
    'Name': 'name',
    'Mentor': 'mentor',
    'Consultant': 'consultant',
    'Vendor': 'vendor',
    'Client': 'client',
    'Job Duties': 'jobDuties',
    'Recruiter': 'recruiter',
    'Batch': 'batch',
    'Position': 'position',
    'Resume': 'resume',
    'Cloud': 'cloud',
    'Start Time': 'startTime',
    'End Time': 'endTime',
    'Interview Kind': 'interviewKind',
    'Rating': 'rating',
    "Mentor's Review": 'mentorReview',
    'Status': 'status',
    'Interview Type': 'interviewType',
    'Comments': 'comments',
    'Duration': 'duration',
    'Created': 'createdDate',
    'Last Modified': 'lastModified',
    'Submission By': 'submissionBy',
    'Unique Submission Identifier': 'uniqueSubmissionId',
    'Coding Required?': 'codingRequired',
    'Interviewers Name': 'interviewerName',
    'Notes': 'notes',
    'Vendor Email': 'vendorEmail',
    'Vendor Phone': 'vendorPhone',
    'Project Duration': 'projectDuration',
    'Submission Type': 'submissionType',
    "Mentor's Email": 'mentorEmail',
    'Vendor Contact Name': 'vendorContactName',
    'Billing Rate': 'billingRate',
    'Work Location': 'workLocation',
    'Vendor Screening': 'vendorScreening',
    'Submission Date': 'submissionDate',
  };

  // Get first tenant
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    console.error('[Seed] No tenant found! Create a tenant first.');
    process.exit(1);
  }
  console.log(`[Seed] Using tenant: ${tenant.name} (${tenant.id})`);

  // Clear existing bench sales data
  const deleted = await prisma.benchSalesSubmission.deleteMany({ where: { tenantId: tenant.id } });
  console.log(`[Seed] Cleared ${deleted.count} existing records`);

  const records: Array<Record<string, unknown>> = [];
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const row: Record<string, string> = {};

    headers.forEach((h, idx) => {
      const dbField = headerMap[h];
      if (dbField && values[idx]) {
        row[dbField] = values[idx];
      }
    });

    // Consultant is required
    if (!row.consultant) {
      skipped++;
      continue;
    }

    records.push({
      tenantId: tenant.id,
      name: row.name || null,
      mentor: row.mentor || null,
      consultant: row.consultant,
      vendor: row.vendor || null,
      client: row.client || null,
      jobDuties: row.jobDuties || null,
      recruiter: row.recruiter || null,
      batch: row.batch || null,
      position: row.position || null,
      resume: row.resume || null,
      cloud: row.cloud || null,
      startTime: tryParseDate(row.startTime ?? '') ,
      endTime: tryParseDate(row.endTime ?? ''),
      interviewKind: row.interviewKind || null,
      rating: row.rating || null,
      mentorReview: row.mentorReview || null,
      status: row.status || null,
      interviewType: row.interviewType || null,
      comments: row.comments || null,
      duration: row.duration || null,
      submissionBy: row.submissionBy || null,
      uniqueSubmissionId: row.uniqueSubmissionId || null,
      codingRequired: row.codingRequired || null,
      interviewerName: row.interviewerName || null,
      notes: row.notes || null,
      vendorEmail: row.vendorEmail || null,
      vendorPhone: row.vendorPhone || null,
      projectDuration: row.projectDuration || null,
      submissionType: row.submissionType || null,
      mentorEmail: row.mentorEmail || null,
      vendorContactName: row.vendorContactName || null,
      billingRate: row.billingRate || null,
      workLocation: row.workLocation || null,
      vendorScreening: row.vendorScreening || null,
      submissionDate: tryParseDate(row.submissionDate ?? ''),
    });
  }

  console.log(`[Seed] Parsed ${records.length} records (skipped ${skipped} without consultant)`);

  // Batch insert in chunks of 500
  const CHUNK_SIZE = 500;
  let imported = 0;
  for (let i = 0; i < records.length; i += CHUNK_SIZE) {
    const chunk = records.slice(i, i + CHUNK_SIZE);
    const result = await prisma.benchSalesSubmission.createMany({
      data: chunk as any[],
      skipDuplicates: true,
    });
    imported += result.count;
    console.log(`[Seed] Batch ${Math.floor(i / CHUNK_SIZE) + 1}: inserted ${result.count} records`);
  }

  console.log(`[Seed] Done! Imported ${imported} bench sales submissions.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('[Seed] Error:', err);
  prisma.$disconnect();
  process.exit(1);
});
