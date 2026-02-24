import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../auth/decorators/current-user.decorator';
import { ImportService } from './import.service';
import { UploadImportDto } from './dto/upload-import.dto';
import { AnalyzeMappingDto } from './dto/analyze-mapping.dto';
import { ExecuteImportDto } from './dto/execute-import.dto';
import { RequirePermissions } from '../auth/rbac';

@Controller('import')
@UseGuards(JwtAuthGuard)
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Get('files')
  @RequirePermissions('import-export:read')
  listFiles() {
    return this.importService.listUploadedFiles();
  }

  @Delete('files/:fileId')
  @RequirePermissions('import-export:delete')
  deleteFile(@Param('fileId') fileId: string) {
    return this.importService.deleteUploadedFile(fileId);
  }

  @Post('reparse/:fileId')
  @RequirePermissions('import-export:create')
  reparse(@Param('fileId') fileId: string) {
    return this.importService.reparseFile(fileId);
  }

  @Post('upload')
  @RequirePermissions('import-export:create')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadImportDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return this.importService.uploadAndParse(
      user.tenantId,
      file,
      dto.entityType,
    );
  }

  @Post('upload-bulk')
  @RequirePermissions('import-export:create')
  @UseInterceptors(FilesInterceptor('files', 20))
  async uploadBulk(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: UploadImportDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one file is required');
    }
    const results = [];
    for (const file of files) {
      const parsed = await this.importService.uploadAndParse(
        user.tenantId,
        file,
        dto.entityType,
      );
      results.push(parsed);
    }
    return results;
  }

  @Post('analyze')
  @RequirePermissions('import-export:create')
  analyze(@Body() dto: AnalyzeMappingDto) {
    return this.importService.analyzeMappings(
      dto.entityType,
      dto.columns,
      dto.sampleRows,
    );
  }

  @Post('execute')
  @RequirePermissions('import-export:create')
  execute(
    @Body() dto: ExecuteImportDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.importService.executeImport(
      user.tenantId,
      user.id,
      dto.fileId,
      dto.entityType,
      dto.mappings,
    );
  }
}
