import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSavedViewDto } from './dto/create-saved-view.dto';
import { UpdateSavedViewDto } from './dto/update-saved-view.dto';
import { QuerySavedViewsDto } from './dto/query-saved-views.dto';

@Injectable()
export class SavedViewsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, query: QuerySavedViewsDto) {
    const where: Prisma.SavedViewWhereInput = { tenantId };

    if (query.entityType) {
      where.entityType = query.entityType;
    }

    return this.prisma.savedView.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async create(tenantId: string, userId: string, dto: CreateSavedViewDto) {
    if (dto.isDefault) {
      await this.prisma.savedView.updateMany({
        where: {
          tenantId,
          entityType: dto.entityType,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    return this.prisma.savedView.create({
      data: {
        tenantId,
        createdById: userId,
        name: dto.name,
        entityType: dto.entityType,
        config: dto.config as Prisma.InputJsonValue,
        isShared: dto.isShared ?? false,
        isDefault: dto.isDefault ?? false,
      },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateSavedViewDto) {
    const existing = await this.prisma.savedView.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException(`Saved view with ID "${id}" not found`);
    }

    if (dto.isDefault) {
      await this.prisma.savedView.updateMany({
        where: {
          tenantId,
          entityType: dto.entityType ?? existing.entityType,
          isDefault: true,
          NOT: { id },
        },
        data: { isDefault: false },
      });
    }

    const { config, ...rest } = dto;

    return this.prisma.savedView.update({
      where: { id },
      data: {
        ...rest,
        ...(config !== undefined && {
          config: config as Prisma.InputJsonValue,
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
    const existing = await this.prisma.savedView.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException(`Saved view with ID "${id}" not found`);
    }

    return this.prisma.savedView.delete({
      where: { id },
    });
  }
}
