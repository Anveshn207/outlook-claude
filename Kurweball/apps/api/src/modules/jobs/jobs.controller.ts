import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { QueryJobsDto } from './dto/query-jobs.dto';
import { BulkStatusJobsDto } from './dto/bulk-status.dto';
import { BulkDeleteJobsDto } from './dto/bulk-delete.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/rbac';

@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  @RequirePermissions('jobs:read')
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: QueryJobsDto,
  ) {
    return this.jobsService.findAll(user.tenantId, query);
  }

  @Post()
  @RequirePermissions('jobs:create')
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateJobDto,
  ) {
    return this.jobsService.create(user.tenantId, user.id, dto);
  }

  @Patch('bulk-status')
  @RequirePermissions('jobs:update')
  async bulkUpdateStatus(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: BulkStatusJobsDto,
  ) {
    return this.jobsService.bulkUpdateStatus(user.tenantId, dto.ids, dto.status);
  }

  @Delete('bulk')
  @RequirePermissions('jobs:delete')
  @HttpCode(HttpStatus.OK)
  async bulkDelete(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: BulkDeleteJobsDto,
  ) {
    return this.jobsService.bulkDelete(user.tenantId, dto.ids);
  }

  @Get(':id')
  @RequirePermissions('jobs:read')
  async findOne(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.jobsService.findOne(user.tenantId, id);
  }

  @Patch(':id')
  @RequirePermissions('jobs:update')
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateJobDto,
  ) {
    return this.jobsService.update(user.tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('jobs:delete')
  @HttpCode(HttpStatus.OK)
  async remove(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.jobsService.remove(user.tenantId, id);
  }
}
