import { IsOptional, IsEnum, IsString, IsInt, IsIn, IsBoolean, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { CandidateSource, CandidateStatus } from '@prisma/client';

export class QueryCandidatesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 25;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(CandidateStatus)
  status?: CandidateStatus;

  @IsOptional()
  @IsEnum(CandidateSource)
  source?: CandidateSource;

  @IsOptional()
  @IsIn(['firstName', 'lastName', 'email', 'status', 'createdAt', 'updatedAt'])
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  hasLinkedin?: boolean;
}
