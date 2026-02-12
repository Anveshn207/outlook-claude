import {
  IsArray,
  IsIn,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ImportEntityType } from '../types/import.types';

class ColumnMappingDto {
  @IsString()
  sourceColumn!: string;

  @IsString()
  targetField!: string;

  @IsNumber()
  @Type(() => Number)
  confidence!: number;
}

export class ExecuteImportDto {
  @IsString()
  fileId!: string;

  @IsString()
  @IsIn(['candidate', 'job', 'client'])
  entityType!: ImportEntityType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ColumnMappingDto)
  mappings!: ColumnMappingDto[];
}
