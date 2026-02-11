import { IsString, IsOptional, IsNumber, IsObject } from 'class-validator';

export class CreateSubmissionDto {
  @IsString()
  candidateId!: string;

  @IsString()
  jobId!: string;

  @IsOptional()
  @IsNumber()
  payRate?: number;

  @IsOptional()
  @IsNumber()
  billRate?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsObject()
  customData?: Record<string, unknown>;
}
