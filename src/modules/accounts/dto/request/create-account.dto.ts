import { IsNotEmpty, IsOptional, IsString, IsBoolean, IsEmail } from 'class-validator';

export class CreateAccountDto {
  @IsOptional()
  @IsString()
  memberId: string;

  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  passwordHash: string;

  @IsOptional()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsBoolean()
  isAdmin?: boolean;
}
