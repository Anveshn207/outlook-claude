import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { QueryActivitiesDto } from './dto/query-activities.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/rbac';

@Controller('activities')
@UseGuards(JwtAuthGuard)
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  @RequirePermissions('activities:read')
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: QueryActivitiesDto,
  ) {
    return this.activitiesService.findAll(user.tenantId, query);
  }

  @Get('recent')
  @RequirePermissions('activities:read')
  async findRecent(
    @CurrentUser() user: CurrentUserPayload,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    return this.activitiesService.findRecent(user.tenantId, parsedLimit);
  }

  @Post()
  @RequirePermissions('activities:create')
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateActivityDto,
  ) {
    return this.activitiesService.create(user.tenantId, user.id, dto);
  }

  @Delete(':id')
  @RequirePermissions('activities:create')
  async remove(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.activitiesService.remove(user.tenantId, id);
  }
}
