import { IsOptional, IsArray, IsString, IsBoolean, IsDate, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  eventName?: string; // Maps to eventName

  @IsOptional()
  @IsString()
  eventDescription?: string; // Maps to eventDescription

  @IsOptional()
  @IsString()
  eventScope?: string;

  @IsOptional()
  @IsString()
  eventType?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date) // Ensures string-to-Date conversion
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @IsOptional()
  @IsEnum(['none', 'daily', 'weekly', 'monthly', 'yearly'])
  recurrenceFrequency?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  interval?: number;

  @IsOptional()
  @IsString()
  byDay?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  byMonthDay?: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  recurrenceEnd?: Date;

  @IsOptional()
  @IsString()
  location?: string;

  // @IsOptional()
  // @IsString()
  // lunarDate?: string;

  @IsOptional()
  @IsBoolean()
  isChangeImage?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  deleteImageIds?: string[];
}