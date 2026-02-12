import { IsArray, IsString, IsEnum } from 'class-validator';
import { JobStatus } from '@prisma/client';

export class BulkStatusJobsDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];

  @IsEnum(JobStatus)
  status: JobStatus;
}
