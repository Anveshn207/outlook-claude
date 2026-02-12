import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { FileParserService } from './file-parser.service';
import { AiMappingService } from './ai-mapping.service';
import { ExportService } from './export.service';
import { ImportService } from './import.service';
import { ImportController } from './import.controller';
import { ExportController } from './export.controller';

@Module({
  imports: [
    MulterModule.register({
      dest: './uploads/imports',
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  ],
  controllers: [ImportController, ExportController],
  providers: [FileParserService, AiMappingService, ExportService, ImportService],
})
export class ImportExportModule {}
