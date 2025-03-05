import { IsOptional, IsString, IsNumber, Min, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class SearchFamilyHistoryRecordDto {
  @IsOptional()
  @IsString()
  search?: string; // Tìm theo tên, mô tả

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1; // Số trang mặc định

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10; // Số kết quả trên mỗi trang mặc định

  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true) // Chuyển đổi chuỗi thành boolean
  @IsBoolean()
  sortByStartDate?: boolean = true; // Mặc định là true
}
