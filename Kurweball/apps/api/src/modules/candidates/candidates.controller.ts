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
import { CandidatesService } from './candidates.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';
import { QueryCandidatesDto } from './dto/query-candidates.dto';
import { BulkStatusCandidatesDto } from './dto/bulk-status.dto';
import { BulkDeleteCandidatesDto } from './dto/bulk-delete.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/rbac';

@Controller('candidates')
@UseGuards(JwtAuthGuard)
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Get()
  @RequirePermissions('candidates:read')
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: QueryCandidatesDto,
  ) {
    return this.candidatesService.findAll(user.tenantId, query);
  }

  @Post()
  @RequirePermissions('candidates:create')
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateCandidateDto,
  ) {
    return this.candidatesService.create(user.tenantId, user.id, dto);
  }

  @Patch('bulk-status')
  @RequirePermissions('candidates:update')
  async bulkUpdateStatus(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: BulkStatusCandidatesDto,
  ) {
    return this.candidatesService.bulkUpdateStatus(user.tenantId, dto.ids, dto.status);
  }

  @Delete('bulk')
  @RequirePermissions('candidates:delete')
  @HttpCode(HttpStatus.OK)
  async bulkDelete(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: BulkDeleteCandidatesDto,
  ) {
    return this.candidatesService.bulkDelete(user.tenantId, dto.ids);
  }

  @Get(':id')
  @RequirePermissions('candidates:read')
  async findOne(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.candidatesService.findOne(user.tenantId, id);
  }

  @Patch(':id')
  @RequirePermissions('candidates:update')
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateCandidateDto,
  ) {
    return this.candidatesService.update(user.tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('candidates:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    await this.candidatesService.remove(user.tenantId, id);
  }
}
