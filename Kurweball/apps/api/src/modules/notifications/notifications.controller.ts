import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Sse,
  Header,
  MessageEvent,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { NotificationsService } from './notifications.service';
import { NotificationSseService } from './notification-sse.service';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/rbac';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly sseService: NotificationSseService,
  ) {}

  @Sse('stream')
  @Header('X-Accel-Buffering', 'no')
  @RequirePermissions('notifications:read')
  subscribe(
    @CurrentUser() user: CurrentUserPayload,
  ): Observable<MessageEvent> {
    return this.sseService.subscribe(user.id);
  }

  @Get()
  @RequirePermissions('notifications:read')
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: QueryNotificationsDto,
  ) {
    return this.notificationsService.findAll(user.tenantId, user.id, query);
  }

  @Get('unread-count')
  @RequirePermissions('notifications:read')
  async getUnreadCount(@CurrentUser() user: CurrentUserPayload) {
    return this.notificationsService.getUnreadCount(user.tenantId, user.id);
  }

  @Patch('read-all')
  @RequirePermissions('notifications:update')
  async markAllRead(@CurrentUser() user: CurrentUserPayload) {
    return this.notificationsService.markAllRead(user.tenantId, user.id);
  }

  @Patch(':id/read')
  @RequirePermissions('notifications:update')
  async markRead(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.notificationsService.markRead(user.tenantId, user.id, id);
  }

  @Delete(':id')
  @RequirePermissions('notifications:update')
  @HttpCode(HttpStatus.OK)
  async remove(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.notificationsService.remove(user.tenantId, user.id, id);
  }
}
