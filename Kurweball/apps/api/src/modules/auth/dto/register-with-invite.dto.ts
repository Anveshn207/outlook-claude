import { IsString, IsEmail, MinLength } from 'class-validator';

export class RegisterWithInviteDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  inviteToken: string;
}
