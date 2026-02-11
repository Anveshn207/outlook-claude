import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomFieldDto } from './dto/create-custom-field.dto';
import { UpdateCustomFieldDto } from './dto/update-custom-field.dto';
import { QueryCustomFieldsDto } from './dto/query-custom-fields.dto';

@Injectable()
export class CustomFieldsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, query: QueryCustomFieldsDto) {
    const where: Prisma.CustomFieldWhereInput = { tenantId };

    if (query.entityType) {
      where.entityType = query.entityType;
    }

    return this.prisma.customField.findMany({
      where,
      orderBy: { displayOrder: 'asc' },
    });
  }

  async create(tenantId: string, dto: CreateCustomFieldDto) {
    return this.prisma.customField.create({
      data: {
        tenantId,
        fieldName: dto.fieldName,
        fieldKey: dto.fieldKey,
        entityType: dto.entityType,
        fieldType: dto.fieldType,
        options: (dto.options ?? []) as Prisma.InputJsonValue,
        isRequired: dto.isRequired,
        isFilterable: dto.isFilterable,
        isVisibleInList: dto.isVisibleInList,
        displayOrder: dto.displayOrder,
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateCustomFieldDto) {
    const existing = await this.prisma.customField.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException(`Custom field with ID "${id}" not found`);
    }

    const { options, ...rest } = dto;

    return this.prisma.customField.update({
      where: { id },
      data: {
        ...rest,
        ...(options !== undefined && {
          options: options as Prisma.InputJsonValue,
        }),
      },
    });
  }

  async remove(tenantId: string, id: string) {
    const existing = await this.prisma.customField.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException(`Custom field with ID "${id}" not found`);
    }

    return this.prisma.customField.delete({
      where: { id },
    });
  }
}
