import { Controller, Get, Query, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { ExportService } from './export.service';
import { ExportQueryDto } from './dto/export-query.dto';
import { RequirePermissions } from '../auth/rbac';

@Controller('export')
@UseGuards(JwtAuthGuard)
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('candidates')
  @RequirePermissions('import-export:read')
  async exportCandidates(
    @Query() query: ExportQueryDto,
    @CurrentUser() user: CurrentUserPayload,
    @Res() res: Response,
  ) {
    const result = await this.exportService.exportCandidates(
      user.tenantId,
      query.format,
      query.search,
      query.status,
      query.hasLinkedin,
    );
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.buffer);
  }

  @Get('jobs')
  @RequirePermissions('import-export:read')
  async exportJobs(
    @Query() query: ExportQueryDto,
    @CurrentUser() user: CurrentUserPayload,
    @Res() res: Response,
  ) {
    const result = await this.exportService.exportJobs(
      user.tenantId,
      query.format,
      query.search,
      query.status,
    );
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.buffer);
  }

  @Get('clients')
  @RequirePermissions('import-export:read')
  async exportClients(
    @Query() query: ExportQueryDto,
    @CurrentUser() user: CurrentUserPayload,
    @Res() res: Response,
  ) {
    const result = await this.exportService.exportClients(
      user.tenantId,
      query.format,
      query.search,
      query.status,
    );
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.buffer);
  }

  @Get('submissions')
  @RequirePermissions('import-export:read')
  async exportSubmissions(
    @Query() query: ExportQueryDto,
    @CurrentUser() user: CurrentUserPayload,
    @Res() res: Response,
  ) {
    const result = await this.exportService.exportSubmissions(
      user.tenantId,
      query.format,
      query.search,
      query.status,
    );
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.buffer);
  }

  @Get('interviews')
  @RequirePermissions('import-export:read')
  async exportInterviews(
    @Query() query: ExportQueryDto,
    @CurrentUser() user: CurrentUserPayload,
    @Res() res: Response,
  ) {
    const result = await this.exportService.exportInterviews(
      user.tenantId,
      query.format,
      query.search,
      query.status,
    );
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.buffer);
  }

  @Get('tasks')
  @RequirePermissions('import-export:read')
  async exportTasks(
    @Query() query: ExportQueryDto,
    @CurrentUser() user: CurrentUserPayload,
    @Res() res: Response,
  ) {
    const result = await this.exportService.exportTasks(
      user.tenantId,
      query.format,
      query.search,
      query.status,
    );
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.buffer);
  }

  @Get('bench-sales')
  @RequirePermissions('import-export:read')
  async exportBenchSales(
    @Query() query: ExportQueryDto,
    @CurrentUser() user: CurrentUserPayload,
    @Res() res: Response,
  ) {
    const result = await this.exportService.exportBenchSales(
      user.tenantId,
      query.format,
      query.search,
      query.status,
    );
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.buffer);
  }

  @Get('users')
  @RequirePermissions('import-export:read')
  async exportUsers(
    @Query() query: ExportQueryDto,
    @CurrentUser() user: CurrentUserPayload,
    @Res() res: Response,
  ) {
    const result = await this.exportService.exportUsers(
      user.tenantId,
      query.format,
      query.search,
      query.status,
    );
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.buffer);
  }
}
