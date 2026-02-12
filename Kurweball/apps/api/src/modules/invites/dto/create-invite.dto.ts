import { IsEmail, IsIn, IsOptional, IsString } from 'class-validator';

export class CreateInviteDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  @IsIn(['ADMIN', 'MANAGER', 'RECRUITER', 'VIEWER'])
  role?: string;
}
