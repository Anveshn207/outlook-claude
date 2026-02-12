import { IsArray, IsString } from 'class-validator';

export class BulkDeleteJobsDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}
