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
      fileFilter: (_req, file, cb) => {
        const allowedMimes = [
          'text/csv',
          'application/csv',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain',
          'application/octet-stream', // Some browsers send this for xlsx/csv
        ];
        const allowedExts = ['.csv', '.xlsx', '.xls'];
        const ext = file.originalname
          ? '.' + file.originalname.split('.').pop()?.toLowerCase()
          : '';
        if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
          cb(null, true);
        } else {
          cb(new Error('Only CSV and Excel files are allowed'), false);
        }
      },
    }),
  ],
  controllers: [ImportController, ExportController],
  providers: [FileParserService, AiMappingService, ExportService, ImportService],
})
export class ImportExportModule {}
