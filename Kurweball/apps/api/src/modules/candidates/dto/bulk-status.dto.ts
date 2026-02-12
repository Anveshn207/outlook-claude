import { IsArray, IsString, IsEnum } from 'class-validator';
import { CandidateStatus } from '@prisma/client';

export class BulkStatusCandidatesDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];

  @IsEnum(CandidateStatus)
  status: CandidateStatus;
}
