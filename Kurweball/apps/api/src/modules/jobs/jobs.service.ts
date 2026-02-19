import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JobStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { QueryJobsDto } from './dto/query-jobs.dto';

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, query: QueryJobsDto) {
    const {
      page = 1,
      limit = 25,
      search,
      status,
      priority,
      jobType,
      clientId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: Prisma.JobWhereInput = { tenantId };

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (jobType) where.jobType = jobType;
    if (clientId) where.clientId = clientId;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          client: { select: { id: true, name: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { submissions: true } },
        },
      }),
      this.prisma.job.count({ where }),
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
    const job = await this.prisma.job.findFirst({
      where: { id, tenantId },
      include: {
        client: true,
        contact: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        submissions: {
          select: {
            id: true,
            status: true,
            submittedAt: true,
            candidate: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
        pipelineTemplate: {
          include: {
            stages: { orderBy: { order: 'asc' } },
          },
        },
        _count: { select: { submissions: true, interviews: true } },
      },
    });

    if (!job) {
      throw new NotFoundException(`Job with id "${id}" not found`);
    }

    return job;
  }

  async create(tenantId: string, userId: string, dto: CreateJobDto) {
    // Verify the client belongs to the same tenant
    const client = await this.prisma.client.findFirst({
      where: { id: dto.clientId, tenantId },
    });

    if (!client) {
      throw new BadRequestException(
        `Client with id "${dto.clientId}" not found in your organization`,
      );
    }

    // If contactId is provided, verify it belongs to the same tenant
    if (dto.contactId) {
      const contact = await this.prisma.contact.findFirst({
        where: { id: dto.contactId, tenantId },
      });

      if (!contact) {
        throw new BadRequestException(
          `Contact with id "${dto.contactId}" not found in your organization`,
        );
      }
    }

    // If pipelineTemplateId is provided, verify it belongs to the same tenant
    if (dto.pipelineTemplateId) {
      const template = await this.prisma.pipelineTemplate.findFirst({
        where: { id: dto.pipelineTemplateId, tenantId },
      });

      if (!template) {
        throw new BadRequestException(
          `Pipeline template with id "${dto.pipelineTemplateId}" not found in your organization`,
        );
      }
    }

    const { customData, ...rest } = dto;

    return this.prisma.job.create({
      data: {
        ...rest,
        tenantId,
        createdById: userId,
        ...(customData !== undefined && {
          customData: customData as unknown as Prisma.InputJsonValue,
        }),
      },
      include: {
        client: { select: { id: true, name: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateJobDto) {
    const existing = await this.prisma.job.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException(`Job with id "${id}" not found`);
    }

    // Cast to access partial properties from PartialType
    const updateData = dto as Partial<CreateJobDto>;

    // If clientId is being changed, verify the new client belongs to the same tenant
    if (updateData.clientId && updateData.clientId !== existing.clientId) {
      const client = await this.prisma.client.findFirst({
        where: { id: updateData.clientId, tenantId },
      });

      if (!client) {
        throw new BadRequestException(
          `Client with id "${updateData.clientId}" not found in your organization`,
        );
      }
    }

    // If contactId is being changed, verify it belongs to the same tenant
    if (updateData.contactId && updateData.contactId !== existing.contactId) {
      const contact = await this.prisma.contact.findFirst({
        where: { id: updateData.contactId, tenantId },
      });

      if (!contact) {
        throw new BadRequestException(
          `Contact with id "${updateData.contactId}" not found in your organization`,
        );
      }
    }

    const { customData, ...rest } = updateData;

    return this.prisma.job.update({
      where: { id },
      data: {
        ...rest,
        ...(customData !== undefined && {
          customData: customData as unknown as Prisma.InputJsonValue,
        }),
      },
      include: {
        client: { select: { id: true, name: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async remove(tenantId: string, id: string) {
    const existing = await this.prisma.job.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException(`Job with id "${id}" not found`);
    }

    await this.prisma.$transaction([
      this.prisma.interview.deleteMany({ where: { jobId: id } }),
      this.prisma.submission.deleteMany({ where: { jobId: id } }),
      this.prisma.activity.deleteMany({ where: { entityType: 'JOB', entityId: id } }),
      this.prisma.job.delete({ where: { id } }),
    ]);

    return { deleted: true };
  }

  async bulkUpdateStatus(tenantId: string, ids: string[], status: JobStatus) {
    const result = await this.prisma.job.updateMany({
      where: { id: { in: ids }, tenantId },
      data: { status },
    });
    console.log(`[JobsService] bulkUpdateStatus count=${result.count} status=${status}`);
    return { updated: result.count };
  }

  async bulkDelete(tenantId: string, ids: string[]) {
    const result = await this.prisma.$transaction(async (tx) => {
      await tx.interview.deleteMany({ where: { jobId: { in: ids } } });
      await tx.submission.deleteMany({ where: { jobId: { in: ids } } });
      await tx.activity.deleteMany({ where: { entityType: 'JOB', entityId: { in: ids } } });
      return tx.job.deleteMany({ where: { id: { in: ids }, tenantId } });
    });
    console.log(`[JobsService] bulkDelete count=${result.count}`);
    return { deleted: result.count };
  }
}
