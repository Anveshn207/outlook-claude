import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsNumber,
  IsArray,
  IsObject,
  Min,
} from 'class-validator';
import { JobType, JobStatus, JobPriority } from '@prisma/client';

export class CreateJobDto {
  @IsString()
  title!: string;

  @IsString()
  clientId!: string;

  @IsOptional()
  @IsString()
  contactId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  requirements?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsEnum(JobType)
  jobType?: JobType;

  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

  @IsOptional()
  @IsInt()
  @Min(1)
  positionsCount?: number;

  @IsOptional()
  @IsNumber()
  billRate?: number;

  @IsOptional()
  @IsNumber()
  payRate?: number;

  @IsOptional()
  @IsEnum(JobPriority)
  priority?: JobPriority;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skillsRequired?: string[];

  @IsOptional()
  @IsString()
  pipelineTemplateId?: string;

  @IsOptional()
  @IsObject()
  customData?: Record<string, unknown>;
}
