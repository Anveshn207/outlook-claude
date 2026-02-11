import { IsOptional, IsString } from 'class-validator';

export class QueryCustomFieldsDto {
  @IsOptional()
  @IsString()
  entityType?: string;
}
