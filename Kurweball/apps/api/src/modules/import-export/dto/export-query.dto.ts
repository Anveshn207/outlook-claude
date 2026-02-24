import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ExportFormat } from '../types/import.types';

export class ExportQueryDto {
  @IsString()
  @IsIn(['csv', 'xlsx', 'docx'])
  format!: ExportFormat;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  hasLinkedin?: boolean;
}
