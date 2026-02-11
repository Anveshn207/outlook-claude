import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats(tenantId: string) {
    console.log('[ReportsService] getDashboardStats for tenant:', tenantId);

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      openJobs,
      activeCandidates,
      totalSubmissions,
      submissionsThisWeek,
      submissionsThisMonth,
      placements,
      totalClients,
      totalInterviews,
    ] = await Promise.all([
      this.prisma.job.count({
        where: { tenantId, status: 'OPEN' },
      }),
      this.prisma.candidate.count({
        where: { tenantId, status: 'ACTIVE' },
      }),
      this.prisma.submission.count({
        where: { tenantId },
      }),
      this.prisma.submission.count({
        where: {
          tenantId,
          submittedAt: { gte: sevenDaysAgo },
        },
      }),
      this.prisma.submission.count({
        where: {
          tenantId,
          submittedAt: { gte: thirtyDaysAgo },
        },
      }),
      this.prisma.submission.count({
        where: { tenantId, status: 'PLACED' },
      }),
      this.prisma.client.count({
        where: { tenantId },
      }),
      this.prisma.interview.count({
        where: { tenantId, status: 'SCHEDULED' },
      }),
    ]);

    return {
      openJobs,
      activeCandidates,
      totalSubmissions,
      submissionsThisWeek,
      submissionsThisMonth,
      placements,
      totalClients,
      totalInterviews,
    };
  }

  async getSubmissionsByRecruiter(tenantId: string) {
    console.log(
      '[ReportsService] getSubmissionsByRecruiter for tenant:',
      tenantId,
    );

    // Get all submissions for this tenant grouped by submittedById
    const submissions = await this.prisma.submission.groupBy({
      by: ['submittedById', 'status'],
      where: { tenantId },
      _count: { id: true },
    });

    // Collect unique recruiter IDs
    const recruiterIds = [
      ...new Set(submissions.map((s) => s.submittedById)),
    ];

    if (recruiterIds.length === 0) {
      return [];
    }

    // Fetch recruiter details
    const recruiters = await this.prisma.user.findMany({
      where: { id: { in: recruiterIds } },
      select: { id: true, firstName: true, lastName: true },
    });

    const recruiterMap = new Map(recruiters.map((r) => [r.id, r]));

    // Build per-recruiter breakdown
    const recruiterStats = new Map<
      string,
      { total: number; placed: number; rejected: number; pending: number }
    >();

    for (const row of submissions) {
      const existing = recruiterStats.get(row.submittedById) ?? {
        total: 0,
        placed: 0,
        rejected: 0,
        pending: 0,
      };

      const count = row._count.id;
      existing.total += count;

      if (row.status === 'PLACED') {
        existing.placed += count;
      } else if (row.status === 'REJECTED' || row.status === 'WITHDRAWN') {
        existing.rejected += count;
      } else {
        existing.pending += count;
      }

      recruiterStats.set(row.submittedById, existing);
    }

    return recruiterIds
      .map((recruiterId) => {
        const recruiter = recruiterMap.get(recruiterId);
        const stats = recruiterStats.get(recruiterId)!;

        return {
          recruiter: recruiter ?? {
            id: recruiterId,
            firstName: 'Unknown',
            lastName: 'User',
          },
          total: stats.total,
          placed: stats.placed,
          rejected: stats.rejected,
          pending: stats.pending,
        };
      })
      .sort((a, b) => b.total - a.total);
  }

  async getPipelineFunnel(tenantId: string, jobId?: string) {
    console.log(
      '[ReportsService] getPipelineFunnel for tenant:',
      tenantId,
      jobId ? `job: ${jobId}` : '(all jobs)',
    );

    // Build filter for submissions
    const submissionWhere: { tenantId: string; jobId?: string } = { tenantId };
    if (jobId) {
      submissionWhere.jobId = jobId;
    }

    // Get submissions with their current stage info
    const submissions = await this.prisma.submission.findMany({
      where: {
        ...submissionWhere,
        currentStageId: { not: null },
      },
      select: {
        currentStageId: true,
      },
    });

    // Count submissions per stage
    const stageCounts = new Map<string, number>();
    for (const sub of submissions) {
      if (sub.currentStageId) {
        stageCounts.set(
          sub.currentStageId,
          (stageCounts.get(sub.currentStageId) ?? 0) + 1,
        );
      }
    }

    if (stageCounts.size === 0) {
      return [];
    }

    // Fetch stage details
    const stageIds = [...stageCounts.keys()];
    const stages = await this.prisma.pipelineStage.findMany({
      where: { id: { in: stageIds } },
      select: {
        id: true,
        name: true,
        color: true,
        order: true,
      },
      orderBy: { order: 'asc' },
    });

    return stages.map((stage) => ({
      stageName: stage.name,
      stageColor: stage.color,
      count: stageCounts.get(stage.id) ?? 0,
      order: stage.order,
    }));
  }

  async getJobsOverview(tenantId: string) {
    console.log('[ReportsService] getJobsOverview for tenant:', tenantId);

    const [open, closed, onHold, filled, total] = await Promise.all([
      this.prisma.job.count({ where: { tenantId, status: 'OPEN' } }),
      this.prisma.job.count({ where: { tenantId, status: 'CLOSED' } }),
      this.prisma.job.count({ where: { tenantId, status: 'ON_HOLD' } }),
      this.prisma.job.count({ where: { tenantId, status: 'FILLED' } }),
      this.prisma.job.count({ where: { tenantId } }),
    ]);

    return { open, closed, onHold, filled, total };
  }

  async getTimeToHire(tenantId: string) {
    console.log('[ReportsService] getTimeToHire for tenant:', tenantId);

    const placedSubmissions = await this.prisma.submission.findMany({
      where: { tenantId, status: 'PLACED' },
      include: {
        job: { select: { id: true, title: true } },
        stageHistory: {
          select: { movedAt: true },
          orderBy: { movedAt: 'asc' },
        },
      },
    });

    if (placedSubmissions.length === 0) {
      return [];
    }

    // Group by job title and calculate avg days
    const jobMap = new Map<
      string,
      { totalDays: number; count: number }
    >();

    for (const sub of placedSubmissions) {
      if (sub.stageHistory.length < 2) continue;

      const earliest = sub.stageHistory[0].movedAt;
      const latest = sub.stageHistory[sub.stageHistory.length - 1].movedAt;
      const days =
        (latest.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24);

      const jobTitle = sub.job.title;
      const existing = jobMap.get(jobTitle) ?? { totalDays: 0, count: 0 };
      existing.totalDays += days;
      existing.count += 1;
      jobMap.set(jobTitle, existing);
    }

    return Array.from(jobMap.entries()).map(([jobTitle, data]) => ({
      jobTitle,
      avgDays: Math.round((data.totalDays / data.count) * 10) / 10,
      count: data.count,
    }));
  }

  async getSourceEffectiveness(tenantId: string) {
    console.log(
      '[ReportsService] getSourceEffectiveness for tenant:',
      tenantId,
    );

    const candidates = await this.prisma.candidate.groupBy({
      by: ['source', 'status'],
      where: { tenantId },
      _count: { id: true },
    });

    // Aggregate by source
    const sourceMap = new Map<
      string,
      { total: number; placed: number }
    >();

    for (const row of candidates) {
      const existing = sourceMap.get(row.source) ?? {
        total: 0,
        placed: 0,
      };
      existing.total += row._count.id;
      if (row.status === 'PLACED') {
        existing.placed += row._count.id;
      }
      sourceMap.set(row.source, existing);
    }

    return Array.from(sourceMap.entries())
      .map(([source, data]) => ({
        source,
        total: data.total,
        placed: data.placed,
        conversionRate:
          data.total > 0
            ? Math.round((data.placed / data.total) * 100 * 10) / 10
            : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }

  async getPipelineVelocity(tenantId: string) {
    console.log(
      '[ReportsService] getPipelineVelocity for tenant:',
      tenantId,
    );

    // Get all stage history entries for this tenant's submissions
    const historyEntries = await this.prisma.submissionStageHistory.findMany({
      where: {
        submission: { tenantId },
      },
      select: {
        submissionId: true,
        stageId: true,
        movedAt: true,
        stage: {
          select: { name: true, color: true, order: true },
        },
      },
      orderBy: [{ submissionId: 'asc' }, { movedAt: 'asc' }],
    });

    if (historyEntries.length === 0) {
      return [];
    }

    // Group by submissionId, then compute time at each stage from consecutive entries
    const stageDurations = new Map<
      string,
      { totalDays: number; count: number; name: string; color: string | null; order: number }
    >();

    let i = 0;
    while (i < historyEntries.length) {
      // Collect entries for the same submission
      const submissionId = historyEntries[i].submissionId;
      const submissionEntries = [];
      while (
        i < historyEntries.length &&
        historyEntries[i].submissionId === submissionId
      ) {
        submissionEntries.push(historyEntries[i]);
        i++;
      }

      // For each consecutive pair, time at stage = next.movedAt - current.movedAt
      for (let j = 0; j < submissionEntries.length - 1; j++) {
        const current = submissionEntries[j];
        const next = submissionEntries[j + 1];
        const days =
          (next.movedAt.getTime() - current.movedAt.getTime()) /
          (1000 * 60 * 60 * 24);

        const existing = stageDurations.get(current.stageId) ?? {
          totalDays: 0,
          count: 0,
          name: current.stage.name,
          color: current.stage.color,
          order: current.stage.order,
        };
        existing.totalDays += days;
        existing.count += 1;
        stageDurations.set(current.stageId, existing);
      }
    }

    return Array.from(stageDurations.values())
      .map((data) => ({
        stageName: data.name,
        stageColor: data.color,
        avgDays: Math.round((data.totalDays / data.count) * 10) / 10,
        order: data.order,
      }))
      .sort((a, b) => a.order - b.order);
  }

  async exportCandidatesCsv(tenantId: string) {
    console.log(
      '[ReportsService] exportCandidatesCsv for tenant:',
      tenantId,
    );

    const candidates = await this.prisma.candidate.findMany({
      where: { tenantId },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        source: true,
        status: true,
        title: true,
        currentEmployer: true,
        location: true,
        skills: true,
      },
    });

    const escapeField = (value: string | null | undefined): string => {
      if (value == null) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const header =
      'First Name,Last Name,Email,Phone,Source,Status,Title,Current Employer,Location,Skills';

    const rows = candidates.map(
      (c) =>
        [
          escapeField(c.firstName),
          escapeField(c.lastName),
          escapeField(c.email),
          escapeField(c.phone),
          escapeField(c.source),
          escapeField(c.status),
          escapeField(c.title),
          escapeField(c.currentEmployer),
          escapeField(c.location),
          escapeField(c.skills.join('; ')),
        ].join(','),
    );

    return [header, ...rows].join('\n');
  }

  async exportSubmissionsCsv(tenantId: string) {
    console.log(
      '[ReportsService] exportSubmissionsCsv for tenant:',
      tenantId,
    );

    const submissions = await this.prisma.submission.findMany({
      where: { tenantId },
      include: {
        candidate: {
          select: { firstName: true, lastName: true, email: true },
        },
        job: {
          select: {
            title: true,
            client: { select: { name: true } },
          },
        },
        submittedBy: {
          select: { firstName: true, lastName: true },
        },
        currentStage: {
          select: { name: true },
        },
      },
    });

    const escapeField = (value: string | null | undefined): string => {
      if (value == null) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const header =
      'Candidate Name,Email,Job Title,Client,Status,Stage,Submitted By,Submitted At,Pay Rate,Bill Rate';

    const rows = submissions.map(
      (s) =>
        [
          escapeField(
            `${s.candidate.firstName} ${s.candidate.lastName}`,
          ),
          escapeField(s.candidate.email),
          escapeField(s.job.title),
          escapeField(s.job.client.name),
          escapeField(s.status),
          escapeField(s.currentStage?.name),
          escapeField(
            `${s.submittedBy.firstName} ${s.submittedBy.lastName}`,
          ),
          escapeField(s.submittedAt.toISOString()),
          escapeField(s.payRate?.toString()),
          escapeField(s.billRate?.toString()),
        ].join(','),
    );

    return [header, ...rows].join('\n');
  }
}
