import { PartialType } from '@nestjs/mapped-types';
import { CreateBenchSalesDto } from './create-bench-sales.dto';

export class UpdateBenchSalesDto extends PartialType(CreateBenchSalesDto) {}
