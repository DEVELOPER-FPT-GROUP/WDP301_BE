import { Transform, Type } from 'class-transformer';
import { IsOptional, IsString, IsBoolean, IsEmail, IsInt, Min, IsNotEmpty } from 'class-validator';

export class SearchAccountDto {
  @IsOptional()
  @IsString()
  search: string;

  @IsOptional()
  @IsString()
  familyId: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true') // Chuyển "true" -> true
  isAdmin?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;
}
