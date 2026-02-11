import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsInt,
  IsEmail,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InterviewType } from '@prisma/client';

export class CreateInterviewDto {
  @IsString()
  candidateId!: string;

  @IsString()
  jobId!: string;

  @IsOptional()
  @IsString()
  submissionId?: string;

  @IsOptional()
  @IsEnum(InterviewType)
  type?: InterviewType;

  @IsDateString()
  scheduledAt!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(15)
  @Max(480)
  durationMinutes?: number = 60;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  meetingLink?: string;

  @IsOptional()
  @IsString()
  interviewerName?: string;

  @IsOptional()
  @IsEmail()
  interviewerEmail?: string;
}
