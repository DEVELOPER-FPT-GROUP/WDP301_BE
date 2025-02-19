import { IsNotEmpty, IsOptional, IsString, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFamilyHistoryRecordDto {
  @IsNotEmpty()
  @IsString()
  familyId: string;
  @IsNotEmpty()
  @IsString()
  historicalRecordTitle: string;

  @IsOptional()
  @IsString()
  historicalRecordSummary?: string;

  @IsOptional()
  @IsString()
  historicalRecordDetails?: string;

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @IsString({ each: true })
  base64Images?: string[];
}
