import { IsArray, IsString, ArrayMaxSize } from 'class-validator';

export class BulkDeleteJobsDto {
  @IsArray()
  @ArrayMaxSize(500)
  @IsString({ each: true })
  ids: string[];
}
