import { IsArray, IsString, IsEnum, ArrayMaxSize } from 'class-validator';
import { JobStatus } from '@prisma/client';

export class BulkStatusJobsDto {
  @IsArray()
  @ArrayMaxSize(500)
  @IsString({ each: true })
  ids: string[];

  @IsEnum(JobStatus)
  status: JobStatus;
}
