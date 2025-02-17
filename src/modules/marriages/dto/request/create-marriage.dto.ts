import { IsString, IsBoolean, IsOptional, IsDateString } from 'class-validator';

export class CreateMarriageDto {
  @IsOptional()
  @IsString()
  wifeId: string;

  @IsOptional()
  @IsString()
  husbandId: string;

  @IsOptional()
  @IsDateString()
  marriedDate: Date;

  @IsOptional()
  @IsBoolean()
  isDivorced?: boolean;

  @IsOptional()
  @IsDateString()
  divorcedDate?: Date;
}
