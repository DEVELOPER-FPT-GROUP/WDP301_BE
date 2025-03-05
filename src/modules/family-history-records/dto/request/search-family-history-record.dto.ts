import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
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
}
