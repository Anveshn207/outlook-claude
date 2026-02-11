import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { PipelineService } from './pipeline.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../auth/decorators/current-user.decorator';

@Controller('pipeline')
@UseGuards(JwtAuthGuard)
export class PipelineController {
  constructor(private readonly pipelineService: PipelineService) {}

  @Get('templates')
  async getTemplates(@CurrentUser() user: CurrentUserPayload) {
    return this.pipelineService.getTemplates(user.tenantId);
  }

  @Get('templates/:id')
  async getTemplate(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.pipelineService.getTemplate(user.tenantId, id);
  }

  @Get('jobs')
  async getJobsWithSubmissions(@CurrentUser() user: CurrentUserPayload) {
    return this.pipelineService.getJobsWithSubmissions(user.tenantId);
  }

  @Get('jobs/:jobId')
  async getKanbanData(
    @CurrentUser() user: CurrentUserPayload,
    @Param('jobId') jobId: string,
  ) {
    return this.pipelineService.getKanbanData(user.tenantId, jobId);
  }
}
