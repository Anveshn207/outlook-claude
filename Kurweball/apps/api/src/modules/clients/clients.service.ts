import { Injectable, NotFoundException } from '@nestjs/common';
import { ClientStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { QueryClientsDto } from './dto/query-clients.dto';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Client Methods ───────────────────────────────────────────────────────

  async findAll(tenantId: string, query: QueryClientsDto) {
    const {
      page = 1,
      limit = 25,
      search,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: Prisma.ClientWhereInput = {
      tenantId,
      ...(status && { status }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { industry: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        include: {
          _count: {
            select: { contacts: true, jobs: true },
          },
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.client.count({ where }),
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
    const client = await this.prisma.client.findFirst({
      where: { id, tenantId },
      include: {
        contacts: {
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
        },
        jobs: {
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID "${id}" not found`);
    }

    return client;
  }

  async create(tenantId: string, userId: string, dto: CreateClientDto) {
    const { customData, ...rest } = dto;

    return this.prisma.client.create({
      data: {
        ...rest,
        customData: (customData ?? {}) as Prisma.InputJsonValue,
        tenantId,
        createdById: userId,
      },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateClientDto) {
    await this.verifyClientExists(tenantId, id);

    const { customData, ...rest } = dto;

    return this.prisma.client.update({
      where: { id },
      data: {
        ...rest,
        ...(customData !== undefined && {
          customData: customData as Prisma.InputJsonValue,
        }),
      },
      include: {
        contacts: {
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async remove(tenantId: string, id: string) {
    await this.verifyClientExists(tenantId, id);

    await this.prisma.$transaction(async (tx) => {
      // Get all jobs for this client to clean up their dependents
      const jobIds = (await tx.job.findMany({ where: { clientId: id }, select: { id: true } })).map(j => j.id);
      if (jobIds.length > 0) {
        await tx.interview.deleteMany({ where: { jobId: { in: jobIds } } });
        await tx.submission.deleteMany({ where: { jobId: { in: jobIds } } });
        await tx.activity.deleteMany({ where: { entityType: 'JOB', entityId: { in: jobIds } } });
        await tx.job.deleteMany({ where: { clientId: id } });
      }
      await tx.contact.deleteMany({ where: { clientId: id } });
      await tx.activity.deleteMany({ where: { entityType: 'CLIENT', entityId: id } });
      await tx.client.delete({ where: { id } });
    });

    return { deleted: true };
  }

  // ─── Contact Methods ──────────────────────────────────────────────────────

  async createContact(
    tenantId: string,
    clientId: string,
    dto: CreateContactDto,
  ) {
    await this.verifyClientExists(tenantId, clientId);

    return this.prisma.contact.create({
      data: {
        ...dto,
        tenantId,
        clientId,
      },
    });
  }

  async updateContact(
    tenantId: string,
    clientId: string,
    contactId: string,
    dto: UpdateContactDto,
  ) {
    await this.verifyContactExists(tenantId, clientId, contactId);

    return this.prisma.contact.update({
      where: { id: contactId },
      data: dto,
    });
  }

  async removeContact(
    tenantId: string,
    clientId: string,
    contactId: string,
  ) {
    await this.verifyContactExists(tenantId, clientId, contactId);

    return this.prisma.contact.delete({ where: { id: contactId } });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async verifyClientExists(tenantId: string, id: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID "${id}" not found`);
    }

    return client;
  }

  private async verifyContactExists(
    tenantId: string,
    clientId: string,
    contactId: string,
  ) {
    const contact = await this.prisma.contact.findFirst({
      where: { id: contactId, clientId, client: { tenantId } },
      select: { id: true },
    });

    if (!contact) {
      throw new NotFoundException(
        `Contact with ID "${contactId}" not found for client "${clientId}"`,
      );
    }

    return contact;
  }

  // ─── Bulk Methods ──────────────────────────────────────────────────────

  async bulkUpdateStatus(tenantId: string, ids: string[], status: ClientStatus) {
    const result = await this.prisma.client.updateMany({
      where: { id: { in: ids }, tenantId },
      data: { status },
    });
    console.log(`[ClientsService] bulkUpdateStatus count=${result.count} status=${status}`);
    return { updated: result.count };
  }

  async bulkDelete(tenantId: string, ids: string[]) {
    const result = await this.prisma.$transaction(async (tx) => {
      // Get all jobs for these clients to clean up their dependents
      const jobIds = (await tx.job.findMany({ where: { clientId: { in: ids } }, select: { id: true } })).map(j => j.id);
      if (jobIds.length > 0) {
        await tx.interview.deleteMany({ where: { jobId: { in: jobIds } } });
        await tx.submission.deleteMany({ where: { jobId: { in: jobIds } } });
        await tx.activity.deleteMany({ where: { entityType: 'JOB', entityId: { in: jobIds } } });
        await tx.job.deleteMany({ where: { clientId: { in: ids } } });
      }
      await tx.contact.deleteMany({ where: { clientId: { in: ids } } });
      await tx.activity.deleteMany({ where: { entityType: 'CLIENT', entityId: { in: ids } } });
      return tx.client.deleteMany({ where: { id: { in: ids }, tenantId } });
    });
    console.log(`[ClientsService] bulkDelete count=${result.count}`);
    return { deleted: result.count };
  }
}
