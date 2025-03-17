import { IsOptional, IsString, IsInt, Min, Max, IsBoolean } from 'class-validator';

export class SearchOrdersDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  // @IsInt()
  // @Min(1)
  // @Max(100)
  page?: number = 1;

  @IsOptional()
  // @IsInt()
  // @Min(1)
  // @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsBoolean()
  sortByDate?: boolean = false;
}
