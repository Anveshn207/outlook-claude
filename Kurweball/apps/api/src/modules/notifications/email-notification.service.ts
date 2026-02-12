import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../../prisma/prisma.service';
import { notificationEmailHtml } from './email-templates';

const EMAIL_NOTIFICATION_TYPES = [
  'INTERVIEW_SCHEDULED',
  'TASK_ASSIGNED',
  'STAGE_CHANGE',
] as const;

@Injectable()
export class EmailNotificationService implements OnModuleInit {
  private transporter: nodemailer.Transporter | null = null;
  private available = false;
  private fromAddress = 'noreply@kurweball.com';

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    const from = this.configService.get<string>('SMTP_FROM');

    if (from) {
      this.fromAddress = from;
    }

    if (!host || !port) {
      console.log('[EmailNotification] SMTP not configured — email notifications disabled');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
    });

    this.available = true;
    console.log(`[EmailNotification] SMTP configured: ${host}:${port}`);
  }

  async sendNotificationEmail(params: {
    userId: string;
    tenantId: string;
    type: string;
    title: string;
    message: string;
    link?: string;
  }): Promise<void> {
    if (!this.available || !this.transporter) return;

    // Only send for specific notification types
    if (!EMAIL_NOTIFICATION_TYPES.includes(params.type as any)) return;

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: params.userId },
        select: { email: true, firstName: true, emailNotifications: true },
      });

      if (!user || !user.emailNotifications) return;

      const html = notificationEmailHtml({
        title: params.title,
        message: params.message,
        link: params.link,
        recipientName: user.firstName,
      });

      await this.transporter.sendMail({
        from: this.fromAddress,
        to: user.email,
        subject: params.title,
        html,
      });

      console.log(`[EmailNotification] Sent to ${user.email}: ${params.title}`);
    } catch (err) {
      console.error(`[EmailNotification] Failed to send email:`, err);
    }
  }
}
