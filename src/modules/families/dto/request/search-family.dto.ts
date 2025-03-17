import { IsOptional, IsString, IsBoolean, IsEnum, IsNumber, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class searchFamilyDTO {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1; // Default page is 1

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10; // Default limit is 10
}
