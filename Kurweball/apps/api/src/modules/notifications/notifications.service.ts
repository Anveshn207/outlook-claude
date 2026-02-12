import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, NotificationType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { NotificationSseService } from './notification-sse.service';
import { EmailNotificationService } from './email-notification.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sseService: NotificationSseService,
    private readonly emailService: EmailNotificationService,
  ) {}

  async findAll(tenantId: string, userId: string, query: QueryNotificationsDto) {
    const { page = 1, limit = 25, isRead } = query;

    const where: Prisma.NotificationWhereInput = { tenantId, userId };

    if (isRead !== undefined) {
      where.isRead = isRead === 'true';
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    console.log(
      `[NotificationsService] findAll tenant=${tenantId} user=${userId} total=${total} page=${page}`,
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

  async getUnreadCount(tenantId: string, userId: string) {
    const count = await this.prisma.notification.count({
      where: { tenantId, userId, isRead: false },
    });

    console.log(
      `[NotificationsService] getUnreadCount tenant=${tenantId} user=${userId} count=${count}`,
    );

    return { count };
  }

  async markRead(tenantId: string, userId: string, id: string) {
    const existing = await this.prisma.notification.findFirst({
      where: { id, tenantId, userId },
    });

    if (!existing) {
      throw new NotFoundException(`Notification with id "${id}" not found`);
    }

    const notification = await this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    console.log(
      `[NotificationsService] markRead id=${id} tenant=${tenantId} user=${userId}`,
    );

    return notification;
  }

  async markAllRead(tenantId: string, userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { tenantId, userId, isRead: false },
      data: { isRead: true },
    });

    console.log(
      `[NotificationsService] markAllRead tenant=${tenantId} user=${userId} updated=${result.count}`,
    );

    return { updated: result.count };
  }

  async createNotification(data: {
    tenantId: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
  }) {
    const notification = await this.prisma.notification.create({
      data: {
        tenantId: data.tenantId,
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link,
      },
    });

    console.log(
      `[NotificationsService] created notification=${notification.id} type=${data.type} tenant=${data.tenantId} user=${data.userId}`,
    );

    // Push real-time SSE notification
    this.sseService.pushToUser(data.userId, notification);

    // Dispatch email notification (fire-and-forget)
    this.emailService.sendNotificationEmail({
      userId: data.userId,
      tenantId: data.tenantId,
      type: data.type,
      title: data.title,
      message: data.message,
      link: data.link,
    }).catch((err) => {
      console.error('[NotificationsService] Email dispatch failed:', err);
    });

    return notification;
  }

  async remove(tenantId: string, userId: string, id: string) {
    const existing = await this.prisma.notification.findFirst({
      where: { id, tenantId, userId },
    });

    if (!existing) {
      throw new NotFoundException(`Notification with id "${id}" not found`);
    }

    await this.prisma.notification.delete({ where: { id } });

    console.log(
      `[NotificationsService] deleted notification=${id} tenant=${tenantId} user=${userId}`,
    );

    return { deleted: true };
  }
}
