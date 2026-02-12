import { IsArray, IsString } from 'class-validator';

export class BulkDeleteClientsDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}
