import { IsString, IsBoolean, IsOptional, IsNotEmpty, IsDateString } from 'class-validator';

export class CreateSpouseDto {
  @IsNotEmpty()
  memberId: string;

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
  @IsString()
  shortSummary?: string;
}
