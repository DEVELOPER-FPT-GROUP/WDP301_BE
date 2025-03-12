import { IsString, IsNotEmpty, IsOptional, IsDateString, IsBoolean, IsEnum, IsNumber } from 'class-validator';
import { Gender } from '../../../../utils/enum';

export class CreateChildDto {
  @IsNotEmpty()
  @IsString()
  parentId: string;

  @IsOptional()
    @IsString()
  parentSpouseId: string;

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
}
