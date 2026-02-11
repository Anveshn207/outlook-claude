import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
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

  @Get('time-to-hire')
  async getTimeToHire(@CurrentUser() user: CurrentUserPayload) {
    return this.reportsService.getTimeToHire(user.tenantId);
  }

  @Get('source-effectiveness')
  async getSourceEffectiveness(@CurrentUser() user: CurrentUserPayload) {
    return this.reportsService.getSourceEffectiveness(user.tenantId);
  }

  @Get('pipeline-velocity')
  async getPipelineVelocity(@CurrentUser() user: CurrentUserPayload) {
    return this.reportsService.getPipelineVelocity(user.tenantId);
  }

  @Get('export/candidates')
  async exportCandidatesCsv(
    @CurrentUser() user: CurrentUserPayload,
    @Res() res: Response,
  ) {
    const csv = await this.reportsService.exportCandidatesCsv(user.tenantId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="candidates.csv"');
    res.send(csv);
  }

  @Get('export/submissions')
  async exportSubmissionsCsv(
    @CurrentUser() user: CurrentUserPayload,
    @Res() res: Response,
  ) {
    const csv = await this.reportsService.exportSubmissionsCsv(user.tenantId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="submissions.csv"');
    res.send(csv);
  }
}
