import { IsArray, IsIn, IsString } from 'class-validator';
import { ImportEntityType } from '../types/import.types';

export class AnalyzeMappingDto {
  @IsString()
  @IsIn(['candidate', 'job', 'client'])
  entityType!: ImportEntityType;

  @IsArray()
  @IsString({ each: true })
  columns!: string[];

  @IsArray()
  sampleRows!: Record<string, string>[];
}
