import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsInt,
  IsArray,
  MinLength,
  MaxLength,
} from 'class-validator';
import { CustomFieldType } from '@prisma/client';

export class CreateCustomFieldDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  fieldName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  fieldKey!: string;

  @IsString()
  @MinLength(1)
  entityType!: string;

  @IsOptional()
  @IsEnum(CustomFieldType)
  fieldType?: CustomFieldType;

  @IsOptional()
  @IsArray()
  options?: unknown[];

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsOptional()
  @IsBoolean()
  isFilterable?: boolean;

  @IsOptional()
  @IsBoolean()
  isVisibleInList?: boolean;

  @IsOptional()
  @IsInt()
  displayOrder?: number;
}
