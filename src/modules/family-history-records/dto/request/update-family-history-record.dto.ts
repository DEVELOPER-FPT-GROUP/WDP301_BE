import { IsOptional, IsString, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

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
  }
