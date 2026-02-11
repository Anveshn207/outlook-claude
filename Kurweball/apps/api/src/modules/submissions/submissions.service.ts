import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import { MoveStageDto } from './dto/move-stage.dto';
import { QuerySubmissionsDto } from './dto/query-submissions.dto';

@Injectable()
export class SubmissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, query: QuerySubmissionsDto) {
    const {
      page = 1,
      limit = 25,
      search,
      status,
      jobId,
      candidateId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: Prisma.SubmissionWhereInput = { tenantId };

    if (status) where.status = status;
    if (jobId) where.jobId = jobId;
    if (candidateId) where.candidateId = candidateId;

    if (search) {
      where.OR = [
        {
          candidate: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
        {
          job: {
            title: { contains: search, mode: 'insensitive' },
          },
        },
      ];
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.submission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          candidate: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              title: true,
            },
          },
          job: {
            select: {
              id: true,
              title: true,
              client: { select: { id: true, name: true } },
            },
          },
          submittedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
          currentStage: {
            select: { id: true, name: true, color: true },
          },
        },
      }),
      this.prisma.submission.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(tenantId: string, id: string) {
    const submission = await this.prisma.submission.findFirst({
      where: { id, tenantId },
      include: {
        candidate: true,
        job: {
          include: {
            client: true,
          },
        },
        submittedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        currentStage: {
          select: { id: true, name: true, color: true, order: true },
        },
        stageHistory: {
          include: {
            stage: { select: { id: true, name: true, color: true } },
            movedBy: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
          orderBy: { movedAt: 'desc' },
        },
        interviews: {
          orderBy: { scheduledAt: 'desc' },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException(`Submission with id "${id}" not found`);
    }

    return submission;
  }

  async create(tenantId: string, userId: string, dto: CreateSubmissionDto) {
    // Verify the candidate belongs to the same tenant
    const candidate = await this.prisma.candidate.findFirst({
      where: { id: dto.candidateId, tenantId },
    });

    if (!candidate) {
      throw new BadRequestException(
        `Candidate with id "${dto.candidateId}" not found in your organization`,
      );
    }

    // Verify the job belongs to the same tenant and get its pipeline template
    const job = await this.prisma.job.findFirst({
      where: { id: dto.jobId, tenantId },
      include: {
        pipelineTemplate: {
          include: {
            stages: { orderBy: { order: 'asc' } },
          },
        },
      },
    });

    if (!job) {
      throw new BadRequestException(
        `Job with id "${dto.jobId}" not found in your organization`,
      );
    }

    // Check for duplicate submission (same candidate + same job)
    const existingSubmission = await this.prisma.submission.findUnique({
      where: {
        tenantId_jobId_candidateId: {
          tenantId,
          jobId: dto.jobId,
          candidateId: dto.candidateId,
        },
      },
    });

    if (existingSubmission) {
      throw new ConflictException(
        'This candidate has already been submitted to this job',
      );
    }

    // Determine the first pipeline stage (order 0 or lowest order)
    const firstStage = job.pipelineTemplate?.stages?.[0] ?? null;

    const { customData, ...rest } = dto;

    // Create submission and initial stage history in a transaction
    return this.prisma.$transaction(async (tx) => {
      const submission = await tx.submission.create({
        data: {
          ...rest,
          tenantId,
          submittedById: userId,
          ...(firstStage && { currentStageId: firstStage.id }),
          ...(customData !== undefined && {
            customData: customData as unknown as Prisma.InputJsonValue,
          }),
        },
        include: {
          candidate: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              title: true,
            },
          },
          job: {
            select: {
              id: true,
              title: true,
              client: { select: { id: true, name: true } },
            },
          },
          submittedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
          currentStage: {
            select: { id: true, name: true, color: true },
          },
        },
      });

      // Create the initial stage history entry
      if (firstStage) {
        await tx.submissionStageHistory.create({
          data: {
            submissionId: submission.id,
            stageId: firstStage.id,
            movedById: userId,
            notes: 'Initial submission',
          },
        });
      }

      return submission;
    });
  }

  async moveStage(
    tenantId: string,
    userId: string,
    id: string,
    dto: MoveStageDto,
  ) {
    // Verify submission belongs to tenant and get its job's pipeline template
    const submission = await this.prisma.submission.findFirst({
      where: { id, tenantId },
      include: {
        job: {
          include: {
            pipelineTemplate: {
              include: {
                stages: true,
              },
            },
          },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException(`Submission with id "${id}" not found`);
    }

    // Verify the target stage belongs to the job's pipeline template
    const templateStages = submission.job.pipelineTemplate?.stages ?? [];
    const targetStage = templateStages.find((s) => s.id === dto.stageId);

    if (!targetStage) {
      throw new BadRequestException(
        `Stage with id "${dto.stageId}" does not belong to this job's pipeline`,
      );
    }

    // Determine status update based on terminal stage
    let newStatus: Prisma.SubmissionUncheckedUpdateInput['status'] = undefined;
    if (targetStage.isTerminal) {
      const stageName = targetStage.name.toLowerCase();
      if (stageName.includes('placed')) {
        newStatus = 'PLACED';
      } else if (stageName.includes('rejected')) {
        newStatus = 'REJECTED';
      } else if (stageName.includes('withdrawn')) {
        newStatus = 'WITHDRAWN';
      } else if (stageName.includes('offered')) {
        newStatus = 'OFFERED';
      }
    }

    // Update submission and create stage history in a transaction
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.submission.update({
        where: { id },
        data: {
          currentStageId: dto.stageId,
          ...(newStatus && { status: newStatus }),
        },
        include: {
          candidate: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              title: true,
            },
          },
          job: {
            select: {
              id: true,
              title: true,
              client: { select: { id: true, name: true } },
            },
          },
          submittedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
          currentStage: {
            select: { id: true, name: true, color: true },
          },
        },
      });

      await tx.submissionStageHistory.create({
        data: {
          submissionId: id,
          stageId: dto.stageId,
          movedById: userId,
          notes: dto.notes,
        },
      });

      return updated;
    });
  }

  async update(tenantId: string, id: string, dto: UpdateSubmissionDto) {
    const existing = await this.prisma.submission.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException(`Submission with id "${id}" not found`);
    }

    const { customData, ...rest } = dto;

    return this.prisma.submission.update({
      where: { id },
      data: {
        ...rest,
        ...(customData !== undefined && {
          customData: customData as unknown as Prisma.InputJsonValue,
        }),
      },
      include: {
        candidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            title: true,
          },
        },
        job: {
          select: {
            id: true,
            title: true,
            client: { select: { id: true, name: true } },
          },
        },
        submittedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        currentStage: {
          select: { id: true, name: true, color: true },
        },
      },
    });
  }

  async remove(tenantId: string, id: string) {
    const existing = await this.prisma.submission.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException(`Submission with id "${id}" not found`);
    }

    await this.prisma.submission.delete({ where: { id } });

    return { deleted: true };
  }
}
