import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationSseService } from './notification-sse.service';
import { EmailNotificationService } from './email-notification.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationSseService, EmailNotificationService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
