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
}
