import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInviteDto } from './dto/create-invite.dto';

@Injectable()
export class InvitesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, createdById: string, dto: CreateInviteDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: { tenantId, email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    const existingInvite = await this.prisma.inviteToken.findFirst({
      where: {
        tenantId,
        email: dto.email,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (existingInvite) {
      throw new ConflictException(
        'An active invite already exists for this email',
      );
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return this.prisma.inviteToken.create({
      data: {
        tenantId,
        email: dto.email,
        role: (dto.role as any) || 'RECRUITER',
        token,
        expiresAt,
        createdById,
      },
      select: {
        id: true,
        email: true,
        role: true,
        token: true,
        expiresAt: true,
        createdAt: true,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.inviteToken.findMany({
      where: { tenantId },
      select: {
        id: true,
        email: true,
        role: true,
        token: true,
        expiresAt: true,
        usedAt: true,
        createdAt: true,
        createdBy: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async delete(tenantId: string, id: string) {
    const invite = await this.prisma.inviteToken.findFirst({
      where: { id, tenantId },
    });
    if (!invite) {
      throw new NotFoundException('Invite not found');
    }
    if (invite.usedAt) {
      throw new BadRequestException('Cannot delete an already-used invite');
    }
    return this.prisma.inviteToken.delete({ where: { id } });
  }

  async validateToken(token: string) {
    const invite = await this.prisma.inviteToken.findUnique({
      where: { token },
    });
    if (!invite) {
      throw new NotFoundException('Invalid invite token');
    }
    if (invite.usedAt) {
      throw new BadRequestException('This invite has already been used');
    }
    if (invite.expiresAt < new Date()) {
      throw new BadRequestException('This invite has expired');
    }
    return invite;
  }

  async markUsed(token: string) {
    return this.prisma.inviteToken.update({
      where: { token },
      data: { usedAt: new Date() },
    });
  }
}
