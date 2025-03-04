import { IsString, IsNumber, IsNotEmpty, IsOptional, IsDateString, IsBoolean, IsEnum } from 'class-validator';
import { Gender } from '../../../../utils/enum';

export class CreateChildDto {
  @IsNotEmpty()
  @IsString()
  memberId: string;

  @IsNumber()
  birthOrder: number;

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

  @IsEnum(Gender)
  gender: Gender;

  @IsOptional()
  @IsBoolean()
  isDeleted?: boolean;

  @IsOptional()
  @IsBoolean()
  isSingle?: boolean;
}
