import { IsArray, IsString, ArrayMaxSize } from 'class-validator';

export class BulkDeleteCandidatesDto {
  @IsArray()
  @ArrayMaxSize(500)
  @IsString({ each: true })
  ids: string[];
}
