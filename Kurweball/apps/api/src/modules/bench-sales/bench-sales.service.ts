import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBenchSalesDto } from './dto/create-bench-sales.dto';
import { UpdateBenchSalesDto } from './dto/update-bench-sales.dto';
import { QueryBenchSalesDto } from './dto/query-bench-sales.dto';

@Injectable()
export class BenchSalesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, query: QueryBenchSalesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 25;
    const skip = (page - 1) * limit;

    const where: Prisma.BenchSalesSubmissionWhereInput = { tenantId };

    if (query.status) {
      where.status = { contains: query.status, mode: 'insensitive' };
    }

    if (query.consultant) {
      where.consultant = { contains: query.consultant, mode: 'insensitive' };
    }

    if (query.vendor) {
      where.vendor = { contains: query.vendor, mode: 'insensitive' };
    }

    if (query.client) {
      where.client = { contains: query.client, mode: 'insensitive' };
    }

    if (query.submissionType) {
      where.submissionType = { contains: query.submissionType, mode: 'insensitive' };
    }

    if (query.search) {
      where.OR = [
        { consultant: { contains: query.search, mode: 'insensitive' } },
        { vendor: { contains: query.search, mode: 'insensitive' } },
        { client: { contains: query.search, mode: 'insensitive' } },
        { position: { contains: query.search, mode: 'insensitive' } },
        { recruiter: { contains: query.search, mode: 'insensitive' } },
        { workLocation: { contains: query.search, mode: 'insensitive' } },
        { vendorContactName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';

    const [data, total] = await Promise.all([
      this.prisma.benchSalesSubmission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.benchSalesSubmission.count({ where }),
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

  async getFilterOptions(tenantId: string) {
    const [statuses, consultants, vendors, clients, submissionTypes] = await Promise.all([
      this.prisma.benchSalesSubmission.findMany({
        where: { tenantId, status: { not: null } },
        select: { status: true },
        distinct: ['status'],
        orderBy: { status: 'asc' },
      }),
      this.prisma.benchSalesSubmission.findMany({
        where: { tenantId },
        select: { consultant: true },
        distinct: ['consultant'],
        orderBy: { consultant: 'asc' },
      }),
      this.prisma.benchSalesSubmission.findMany({
        where: { tenantId, vendor: { not: null } },
        select: { vendor: true },
        distinct: ['vendor'],
        orderBy: { vendor: 'asc' },
      }),
      this.prisma.benchSalesSubmission.findMany({
        where: { tenantId, client: { not: null } },
        select: { client: true },
        distinct: ['client'],
        orderBy: { client: 'asc' },
      }),
      this.prisma.benchSalesSubmission.findMany({
        where: { tenantId, submissionType: { not: null } },
        select: { submissionType: true },
        distinct: ['submissionType'],
        orderBy: { submissionType: 'asc' },
      }),
    ]);

    return {
      statuses: statuses.map(s => s.status).filter(Boolean),
      consultants: consultants.map(c => c.consultant).filter(Boolean),
      vendors: vendors.map(v => v.vendor).filter(Boolean),
      clients: clients.map(c => c.client).filter(Boolean),
      submissionTypes: submissionTypes.map(s => s.submissionType).filter(Boolean),
    };
  }

  async findOne(tenantId: string, id: string) {
    const record = await this.prisma.benchSalesSubmission.findFirst({
      where: { id, tenantId },
    });

    if (!record) {
      throw new NotFoundException(`Bench sales record with ID "${id}" not found`);
    }

    return record;
  }

  async create(tenantId: string, dto: CreateBenchSalesDto) {
    return this.prisma.benchSalesSubmission.create({
      data: {
        tenantId,
        ...dto,
        startTime: dto.startTime ? new Date(dto.startTime) : null,
        endTime: dto.endTime ? new Date(dto.endTime) : null,
        submissionDate: dto.submissionDate ? new Date(dto.submissionDate) : null,
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateBenchSalesDto) {
    const existing = await this.prisma.benchSalesSubmission.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException(`Bench sales record with ID "${id}" not found`);
    }

    return this.prisma.benchSalesSubmission.update({
      where: { id },
      data: {
        ...dto,
        startTime: dto.startTime !== undefined ? (dto.startTime ? new Date(dto.startTime) : null) : undefined,
        endTime: dto.endTime !== undefined ? (dto.endTime ? new Date(dto.endTime) : null) : undefined,
        submissionDate: dto.submissionDate !== undefined ? (dto.submissionDate ? new Date(dto.submissionDate) : null) : undefined,
      },
    });
  }

  async remove(tenantId: string, id: string) {
    const existing = await this.prisma.benchSalesSubmission.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException(`Bench sales record with ID "${id}" not found`);
    }

    await this.prisma.benchSalesSubmission.delete({ where: { id } });
    return { deleted: true };
  }

  async bulkImport(tenantId: string, records: CreateBenchSalesDto[]) {
    const created = await this.prisma.benchSalesSubmission.createMany({
      data: records.map(r => ({
        tenantId,
        name: r.name || null,
        consultant: r.consultant,
        vendor: r.vendor || null,
        client: r.client || null,
        jobDuties: r.jobDuties || null,
        recruiter: r.recruiter || null,
        batch: r.batch || null,
        position: r.position || null,
        resume: r.resume || null,
        cloud: r.cloud || null,
        startTime: r.startTime ? new Date(r.startTime) : null,
        endTime: r.endTime ? new Date(r.endTime) : null,
        interviewKind: r.interviewKind || null,
        rating: r.rating || null,
        mentorsReview: r.mentorsReview || null,
        status: r.status || null,
        interviewType: r.interviewType || null,
        comments: r.comments || null,
        duration: r.duration || null,
        submissionBy: r.submissionBy || null,
        uniqueSubmissionId: r.uniqueSubmissionId || null,
        codingRequired: r.codingRequired || null,
        interviewerName: r.interviewerName || null,
        notes: r.notes || null,
        vendorEmail: r.vendorEmail || null,
        vendorPhone: r.vendorPhone || null,
        projectDuration: r.projectDuration || null,
        submissionType: r.submissionType || null,
        mentorsEmail: r.mentorsEmail || null,
        vendorContactName: r.vendorContactName || null,
        billingRate: r.billingRate || null,
        workLocation: r.workLocation || null,
        vendorScreening: r.vendorScreening || null,
        submissionDate: r.submissionDate ? new Date(r.submissionDate) : null,
      })),
      skipDuplicates: true,
    });

    console.log(`[BenchSalesService] bulkImport created=${created.count}`);
    return { imported: created.count };
  }

  async bulkDelete(tenantId: string, ids: string[]) {
    const result = await this.prisma.benchSalesSubmission.deleteMany({
      where: { id: { in: ids }, tenantId },
    });
    console.log(`[BenchSalesService] bulkDelete count=${result.count}`);
    return { deleted: result.count };
  }
}
