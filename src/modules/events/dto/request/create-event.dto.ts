import { IsString, IsNotEmpty, IsOptional, IsDate, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  createdBy: string;

  @IsString()
  @IsOptional()
  eventScope?: string;

  @IsString()
  @IsOptional()
  eventType?: string;

  @IsString()
  @IsNotEmpty()
  eventName: string;

  @IsString()
  @IsOptional()
  eventDescription?: string;

  @IsDate()
  @Type(() => Date) // ✅ Ensures conversion from string to Date
  @IsOptional()
  startDate?: Date;

  @IsDate()
  @Type(() => Date) // ✅ Ensures conversion from string to Date
  @IsOptional()
  endDate?: Date;

  @IsEnum(['none', 'daily', 'weekly', 'monthly', 'yearly'])
  @IsOptional()
  recurrenceFrequency?: string;

  @IsNumber()
  @IsOptional()
  interval?: number;

  @IsString()
  @IsOptional()
  byDay?: string;

  @IsNumber()
  @IsOptional()
  byMonthDay?: number;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  recurrenceEnd?: Date;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  lunarDate?: string;
}
