import { Controller, Get, Query, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { ExportService } from './export.service';
import { ExportQueryDto } from './dto/export-query.dto';

@Controller('export')
@UseGuards(JwtAuthGuard)
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('candidates')
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
    );
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.buffer);
  }

  @Get('jobs')
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
}
