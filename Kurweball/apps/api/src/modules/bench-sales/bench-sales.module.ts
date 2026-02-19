import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { BenchSalesService } from './bench-sales.service';
import { BenchSalesController } from './bench-sales.controller';

@Module({
  imports: [
    MulterModule.register({
      dest: './uploads/bench-sales',
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (_req, file, cb) => {
        const allowed = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
          'application/rtf',
        ];
        if (allowed.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Only PDF, DOC, DOCX, TXT, and RTF files are allowed'), false);
        }
      },
    }),
  ],
  controllers: [BenchSalesController],
  providers: [BenchSalesService],
  exports: [BenchSalesService],
})
export class BenchSalesModule {}
