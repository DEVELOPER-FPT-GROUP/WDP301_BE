import { IsString, IsBoolean, IsOptional, IsNumber, IsEnum, IsNotEmpty, IsDateString } from 'class-validator';
import { Gender } from '../../../../utils/enum';

export class CreateMemberDto {
  @IsNotEmpty()
  familyId: string;

  @IsNotEmpty()
  firstName: string;

  @IsOptional()
  @IsString()
  middleName?: string;

  @IsNotEmpty()
  lastName: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: Date;

  @IsOptional()
  @IsDateString()
  dateOfDeath?: Date;

  @IsOptional()
  @IsString()
  placeOfBirth?: string;

  @IsOptional()
  @IsString()
  placeOfDeath?: string;

  @IsOptional()
  @IsBoolean()
  isAlive?: boolean;

  @IsOptional()
  @IsNumber()
  generation?: number;

  @IsOptional()
  @IsString()
  shortSummary?: string;

  @IsEnum(Gender)
  gender: Gender;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  password?: string;
}
