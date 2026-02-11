import { IsOptional, IsString } from 'class-validator';

export class QuerySavedViewsDto {
  @IsOptional()
  @IsString()
  entityType?: string;
}
