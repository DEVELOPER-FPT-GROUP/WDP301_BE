import { IsNumber, IsOptional } from 'class-validator';

export class CreateTrackingDto {
  @IsNumber()
  totalViews: number;

  @IsNumber()
  totalRevenue: number;
}
