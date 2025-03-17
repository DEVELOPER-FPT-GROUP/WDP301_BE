import { IsNotEmpty, IsOptional, IsString, IsBoolean, IsEmail, IsEnum } from 'class-validator';
import { Role } from '../../../../utils/enum';

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

  @IsEnum(Role)
  role: string;
}
