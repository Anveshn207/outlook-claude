import { IsArray, IsString, IsEnum, ArrayMaxSize } from 'class-validator';
import { CandidateStatus } from '@prisma/client';

export class BulkStatusCandidatesDto {
  @IsArray()
  @ArrayMaxSize(500)
  @IsString({ each: true })
  ids: string[];

  @IsEnum(CandidateStatus)
  status: CandidateStatus;
}
