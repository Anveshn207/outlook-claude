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
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BenchSalesService } from './bench-sales.service';
import { CreateBenchSalesDto } from './dto/create-bench-sales.dto';
import { UpdateBenchSalesDto } from './dto/update-bench-sales.dto';
import { QueryBenchSalesDto } from './dto/query-bench-sales.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/rbac';

@Controller('bench-sales')
@UseGuards(JwtAuthGuard)
export class BenchSalesController {
  constructor(private readonly benchSalesService: BenchSalesService) {}

  @Get()
  @RequirePermissions('bench-sales:read')
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: QueryBenchSalesDto,
  ) {
    return this.benchSalesService.findAll(user.tenantId, query);
  }

  @Get('filters')
  @RequirePermissions('bench-sales:read')
  async getFilterOptions(@CurrentUser() user: CurrentUserPayload) {
    return this.benchSalesService.getFilterOptions(user.tenantId);
  }

  @Post()
  @RequirePermissions('bench-sales:create')
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateBenchSalesDto,
  ) {
    return this.benchSalesService.create(user.tenantId, dto);
  }

  @Post('bulk-import')
  @RequirePermissions('bench-sales:create')
  async bulkImport(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: { records: CreateBenchSalesDto[] },
  ) {
    return this.benchSalesService.bulkImport(user.tenantId, body.records);
  }

  @Delete('bulk')
  @RequirePermissions('bench-sales:delete')
  @HttpCode(HttpStatus.OK)
  async bulkDelete(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: { ids: string[] },
  ) {
    return this.benchSalesService.bulkDelete(user.tenantId, body.ids);
  }

  @Post('upload-resume')
  @RequirePermissions('bench-sales:create')
  @UseInterceptors(FileInterceptor('file'))
  uploadResume(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file provided');
    return {
      url: `/uploads/bench-sales/${file.filename}`,
      fileName: file.originalname,
      fileSize: file.size,
    };
  }

  @Get(':id')
  @RequirePermissions('bench-sales:read')
  async findOne(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.benchSalesService.findOne(user.tenantId, id);
  }

  @Patch(':id')
  @RequirePermissions('bench-sales:update')
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateBenchSalesDto,
  ) {
    return this.benchSalesService.update(user.tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('bench-sales:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    await this.benchSalesService.remove(user.tenantId, id);
  }
}
