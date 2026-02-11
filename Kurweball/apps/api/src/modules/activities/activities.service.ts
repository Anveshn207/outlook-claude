import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { QueryActivitiesDto } from './dto/query-activities.dto';

@Injectable()
export class ActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, query: QueryActivitiesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 25;
    const skip = (page - 1) * limit;
    const sortOrder = query.sortOrder ?? 'desc';

    const where: Prisma.ActivityWhereInput = { tenantId };

    if (query.entityType) {
      where.entityType = query.entityType;
    }

    if (query.entityId) {
      where.entityId = query.entityId;
    }

    if (query.type) {
      where.type = query.type as Prisma.ActivityWhereInput['type'];
    }

    const [data, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: sortOrder },
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      }),
      this.prisma.activity.count({ where }),
    ]);

    console.log(
      `[ActivitiesService] findAll tenantId=${tenantId} page=${page} total=${total}`,
    );

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

  async findRecent(tenantId: string, limit = 10) {
    const data = await this.prisma.activity.findMany({
      where: { tenantId },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    console.log(
      `[ActivitiesService] findRecent tenantId=${tenantId} limit=${limit} returned=${data.length}`,
    );

    return data;
  }

  async create(tenantId: string, userId: string, dto: CreateActivityDto) {
    const activity = await this.prisma.activity.create({
      data: {
        tenantId,
        createdById: userId,
        entityType: dto.entityType,
        entityId: dto.entityId,
        type: dto.type,
        subject: dto.subject,
        body: dto.body,
        metadata: (dto.metadata ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
      },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    console.log(
      `[ActivitiesService] created activity id=${activity.id} type=${activity.type} entity=${activity.entityType}:${activity.entityId}`,
    );

    return activity;
  }

  async remove(tenantId: string, id: string) {
    const existing = await this.prisma.activity.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException(`Activity with ID "${id}" not found`);
    }

    await this.prisma.activity.delete({
      where: { id },
    });

    console.log(`[ActivitiesService] deleted activity id=${id}`);

    return { deleted: true };
  }
}
