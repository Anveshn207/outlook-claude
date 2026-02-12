import { IsIn, IsOptional, IsString } from 'class-validator';
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
}
