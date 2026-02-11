import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../auth/decorators/current-user.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  async getDashboardStats(@CurrentUser() user: CurrentUserPayload) {
    return this.reportsService.getDashboardStats(user.tenantId);
  }

  @Get('submissions-by-recruiter')
  async getSubmissionsByRecruiter(@CurrentUser() user: CurrentUserPayload) {
    return this.reportsService.getSubmissionsByRecruiter(user.tenantId);
  }

  @Get('pipeline-funnel')
  async getPipelineFunnel(
    @CurrentUser() user: CurrentUserPayload,
    @Query('jobId') jobId?: string,
  ) {
    return this.reportsService.getPipelineFunnel(user.tenantId, jobId);
  }

  @Get('jobs-overview')
  async getJobsOverview(@CurrentUser() user: CurrentUserPayload) {
    return this.reportsService.getJobsOverview(user.tenantId);
  }
}
