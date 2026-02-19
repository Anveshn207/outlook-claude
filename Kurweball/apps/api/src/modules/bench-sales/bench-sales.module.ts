import { Module } from '@nestjs/common';
import { BenchSalesService } from './bench-sales.service';
import { BenchSalesController } from './bench-sales.controller';

@Module({
  controllers: [BenchSalesController],
  providers: [BenchSalesService],
  exports: [BenchSalesService],
})
export class BenchSalesModule {}
