import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';
import { ActivityType } from '@prisma/client';

export class CreateActivityDto {
  @IsString()
  entityType!: string;

  @IsString()
  entityId!: string;

  @IsEnum(ActivityType)
  type!: ActivityType;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
