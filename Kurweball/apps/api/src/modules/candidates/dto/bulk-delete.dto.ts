import { IsArray, IsString } from 'class-validator';

export class BulkDeleteCandidatesDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}
