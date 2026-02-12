import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';

const userSelect = {
  id: true,
  tenantId: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  avatarUrl: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, query: QueryUsersDto) {
    const { page = 1, limit = 25, search, role, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    const where: Prisma.UserWhereInput = { tenantId };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role as Prisma.EnumUserRoleFilter['equals'];
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: userSelect,
      }),
      this.prisma.user.count({ where }),
    ]);

    console.log(
      `[UsersService] findAll tenant=${tenantId} total=${total} page=${page}`,
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

  async findOne(tenantId: string, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId },
      select: userSelect,
    });

    if (!user) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }

    return user;
  }

  async create(tenantId: string, dto: CreateUserDto) {
    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        tenantId,
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: (dto.role as UserRole) || UserRole.RECRUITER,
      },
      select: userSelect,
    });

    console.log(
      `[UsersService] created user=${user.id} email=${dto.email} tenant=${tenantId}`,
    );

    return user;
  }

  async update(tenantId: string, id: string, dto: UpdateUserDto) {
    const existing = await this.prisma.user.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }

    const updateData: Prisma.UserUpdateInput = {};

    if (dto.role !== undefined) updateData.role = dto.role as UserRole;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.firstName !== undefined) updateData.firstName = dto.firstName;
    if (dto.lastName !== undefined) updateData.lastName = dto.lastName;

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: userSelect,
    });

    console.log(`[UsersService] updated user=${id} tenant=${tenantId}`);

    return user;
  }
}
