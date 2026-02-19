import { IsString, IsOptional, MaxLength, IsDateString } from 'class-validator';

export class CreateBenchSalesDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  name?: string;

  @IsString()
  @MaxLength(200)
  consultant!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  vendor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  client?: string;

  @IsOptional()
  @IsString()
  jobDuties?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  recruiter?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  batch?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  position?: string;

  @IsOptional()
  @IsString()
  resume?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  cloud?: string;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  interviewKind?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  rating?: string;

  @IsOptional()
  @IsString()
  mentorsReview?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  interviewType?: string;

  @IsOptional()
  @IsString()
  comments?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  duration?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  submissionBy?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  uniqueSubmissionId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  codingRequired?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  interviewerName?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  vendorEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  vendorPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  projectDuration?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  submissionType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  mentorsEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  vendorContactName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  billingRate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  workLocation?: string;

  @IsOptional()
  @IsString()
  vendorScreening?: string;

  @IsOptional()
  @IsDateString()
  submissionDate?: string;
}
