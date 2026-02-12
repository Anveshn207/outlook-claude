import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { PipelineService } from './pipeline.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/rbac';

@Controller('pipeline')
@UseGuards(JwtAuthGuard)
export class PipelineController {
  constructor(private readonly pipelineService: PipelineService) {}

  @Get('templates')
  @RequirePermissions('pipeline:read')
  async getTemplates(@CurrentUser() user: CurrentUserPayload) {
    return this.pipelineService.getTemplates(user.tenantId);
  }

  @Get('templates/:id')
  @RequirePermissions('pipeline:read')
  async getTemplate(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.pipelineService.getTemplate(user.tenantId, id);
  }

  @Get('jobs')
  @RequirePermissions('pipeline:read')
  async getJobsWithSubmissions(@CurrentUser() user: CurrentUserPayload) {
    return this.pipelineService.getJobsWithSubmissions(user.tenantId);
  }

  @Get('jobs/:jobId')
  @RequirePermissions('pipeline:read')
  async getKanbanData(
    @CurrentUser() user: CurrentUserPayload,
    @Param('jobId') jobId: string,
  ) {
    return this.pipelineService.getKanbanData(user.tenantId, jobId);
  }
}
