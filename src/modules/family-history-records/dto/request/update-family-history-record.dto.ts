import { IsOptional, IsString, IsDate, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class UpdateFamilyHistoryRecordDto {
  @IsOptional()
  @IsString()
  historicalRecordTitle?: string;

  @IsOptional()
  @IsString()
  historicalRecordSummary?: string;

  @IsOptional()
  @IsString()
  historicalRecordDetails?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  isChangeImage?: boolean;

  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  deleteImageIds: string[];
}
