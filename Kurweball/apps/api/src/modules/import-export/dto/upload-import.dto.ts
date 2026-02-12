import { IsIn, IsString } from 'class-validator';
import { ImportEntityType } from '../types/import.types';

export class UploadImportDto {
  @IsString()
  @IsIn(['candidate', 'job', 'client'])
  entityType!: ImportEntityType;
}
