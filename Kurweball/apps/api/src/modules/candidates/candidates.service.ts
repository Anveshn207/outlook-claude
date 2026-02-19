import { Injectable, NotFoundException } from '@nestjs/common';
import { CandidateStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';
import { QueryCandidatesDto } from './dto/query-candidates.dto';

@Injectable()
export class CandidatesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, query: QueryCandidatesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 25;
    const skip = (page - 1) * limit;

    const where: Prisma.CandidateWhereInput = { tenantId };

    if (query.status) {
      where.status = query.status;
    }

    if (query.source) {
      where.source = query.source;
    }

    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { title: { contains: query.search, mode: 'insensitive' } },
        { currentEmployer: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';

    const [data, total] = await Promise.all([
      this.prisma.candidate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      }),
      this.prisma.candidate.count({ where }),
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
    const candidate = await this.prisma.candidate.findFirst({
      where: { id, tenantId },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        submissions: {
          include: {
            job: { select: { id: true, title: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        resumes: {
          orderBy: { uploadedAt: 'desc' },
        },
      },
    });

    if (!candidate) {
      throw new NotFoundException(`Candidate with ID "${id}" not found`);
    }

    return candidate;
  }

  async create(tenantId: string, userId: string, dto: CreateCandidateDto) {
    return this.prisma.candidate.create({
      data: {
        tenantId,
        createdById: userId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        source: dto.source,
        status: dto.status,
        title: dto.title,
        currentEmployer: dto.currentEmployer,
        location: dto.location,
        visaStatus: dto.visaStatus,
        linkedinUrl: dto.linkedinUrl,
        rate: dto.rate,
        rateType: dto.rateType,
        availability: dto.availability,
        skills: dto.skills ?? [],
        tags: dto.tags ?? [],
        customData: (dto.customData ?? {}) as Prisma.InputJsonValue,
      },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateCandidateDto) {
    const existing = await this.prisma.candidate.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException(`Candidate with ID "${id}" not found`);
    }

    const { customData, ...rest } = dto;

    return this.prisma.candidate.update({
      where: { id },
      data: {
        ...rest,
        ...(customData !== undefined && {
          customData: customData as Prisma.InputJsonValue,
        }),
      },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async remove(tenantId: string, id: string) {
    const existing = await this.prisma.candidate.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException(`Candidate with ID "${id}" not found`);
    }

    await this.prisma.$transaction([
      this.prisma.interview.deleteMany({ where: { candidateId: id } }),
      this.prisma.submission.deleteMany({ where: { candidateId: id } }),
      this.prisma.resume.deleteMany({ where: { candidateId: id } }),
      this.prisma.activity.deleteMany({ where: { entityType: 'CANDIDATE', entityId: id } }),
      this.prisma.candidate.delete({ where: { id } }),
    ]);

    return { deleted: true };
  }

  async bulkUpdateStatus(tenantId: string, ids: string[], status: CandidateStatus) {
    const result = await this.prisma.candidate.updateMany({
      where: { id: { in: ids }, tenantId },
      data: { status },
    });
    console.log(`[CandidatesService] bulkUpdateStatus count=${result.count} status=${status}`);
    return { updated: result.count };
  }

  async bulkDelete(tenantId: string, ids: string[]) {
    const result = await this.prisma.$transaction(async (tx) => {
      await tx.interview.deleteMany({ where: { candidateId: { in: ids } } });
      await tx.submission.deleteMany({ where: { candidateId: { in: ids } } });
      await tx.resume.deleteMany({ where: { candidateId: { in: ids } } });
      await tx.activity.deleteMany({ where: { entityType: 'CANDIDATE', entityId: { in: ids } } });
      return tx.candidate.deleteMany({ where: { id: { in: ids }, tenantId } });
    });
    console.log(`[CandidatesService] bulkDelete count=${result.count}`);
    return { deleted: result.count };
  }
}
