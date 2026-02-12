import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../auth/decorators/current-user.decorator';
import { ImportService } from './import.service';
import { UploadImportDto } from './dto/upload-import.dto';
import { AnalyzeMappingDto } from './dto/analyze-mapping.dto';
import { ExecuteImportDto } from './dto/execute-import.dto';

@Controller('import')
@UseGuards(JwtAuthGuard)
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadImportDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.importService.uploadAndParse(
      user.tenantId,
      file,
      dto.entityType,
    );
  }

  @Post('analyze')
  analyze(@Body() dto: AnalyzeMappingDto) {
    return this.importService.analyzeMappings(
      dto.entityType,
      dto.columns,
      dto.sampleRows,
    );
  }

  @Post('execute')
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
