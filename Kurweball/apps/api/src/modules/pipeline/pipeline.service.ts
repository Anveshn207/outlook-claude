import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PipelineService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * List all pipeline templates for a tenant, including stages ordered by position.
   */
  async getTemplates(tenantId: string) {
    return this.prisma.pipelineTemplate.findMany({
      where: { tenantId },
      include: {
        stages: { orderBy: { order: 'asc' } },
        _count: { select: { jobs: true } },
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  /**
   * Get a single pipeline template with its stages.
   */
  async getTemplate(tenantId: string, templateId: string) {
    const template = await this.prisma.pipelineTemplate.findFirst({
      where: { id: templateId, tenantId },
      include: {
        stages: { orderBy: { order: 'asc' } },
        _count: { select: { jobs: true } },
      },
    });

    if (!template) {
      throw new NotFoundException(
        `Pipeline template with id "${templateId}" not found`,
      );
    }

    return template;
  }

  /**
   * Get kanban board data for a specific job.
   *
   * Returns the job info, pipeline stages in order, and submissions
   * grouped into their respective stages. Submissions without a
   * currentStageId are placed into the first (lowest-order) stage.
   */
  async getKanbanData(tenantId: string, jobId: string) {
    // 1. Get the job and verify tenant ownership
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, tenantId },
      include: {
        client: { select: { id: true, name: true } },
        pipelineTemplate: {
          include: {
            stages: { orderBy: { order: 'asc' } },
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundException(`Job with id "${jobId}" not found`);
    }

    // 2. Resolve the pipeline template — use job's template or fall back to tenant default
    let stages = job.pipelineTemplate?.stages ?? [];

    if (!job.pipelineTemplate) {
      const defaultTemplate = await this.prisma.pipelineTemplate.findFirst({
        where: { tenantId, isDefault: true },
        include: {
          stages: { orderBy: { order: 'asc' } },
        },
      });

      if (defaultTemplate) {
        stages = defaultTemplate.stages;
      }
    }

    // 3. Get all submissions for this job
    const submissions = await this.prisma.submission.findMany({
      where: { jobId, tenantId },
      include: {
        candidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
            email: true,
          },
        },
        currentStage: {
          select: { id: true, name: true },
        },
        submittedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    // 4. Determine the first stage ID (for submissions without a currentStageId)
    const firstStageId = stages.length > 0 ? stages[0].id : null;

    // 5. Group submissions by stage
    const submissionsByStage = new Map<string, typeof submissions>();

    for (const stage of stages) {
      submissionsByStage.set(stage.id, []);
    }

    for (const submission of submissions) {
      const stageId = submission.currentStageId ?? firstStageId;

      if (stageId && submissionsByStage.has(stageId)) {
        submissionsByStage.get(stageId)!.push(submission);
      }
    }

    // 6. Build the response
    return {
      job: {
        id: job.id,
        title: job.title,
        status: job.status,
        client: { id: job.client.id, name: job.client.name },
      },
      stages: stages.map((stage) => ({
        id: stage.id,
        name: stage.name,
        order: stage.order,
        color: stage.color,
        isTerminal: stage.isTerminal,
        submissions: (submissionsByStage.get(stage.id) ?? []).map((sub) => ({
          id: sub.id,
          status: sub.status,
          submittedAt: sub.submittedAt,
          notes: sub.notes,
          candidate: sub.candidate,
          currentStage: sub.currentStage,
          submittedBy: sub.submittedBy,
        })),
      })),
    };
  }

  /**
   * List jobs that have at least one submission — used for the kanban job selector dropdown.
   */
  async getJobsWithSubmissions(tenantId: string) {
    return this.prisma.job.findMany({
      where: {
        tenantId,
        submissions: { some: {} },
      },
      select: {
        id: true,
        title: true,
        status: true,
        client: { select: { id: true, name: true } },
        _count: { select: { submissions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
