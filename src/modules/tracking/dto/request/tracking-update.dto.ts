import { IsNumber, IsOptional } from 'class-validator';


export class UpdateTrackingDto {
  @IsOptional()
  @IsNumber()
  totalViews?: number;

  @IsOptional()
  @IsNumber()
  totalRevenue?: number;

  @IsOptional()
  monthlyViews?: Map<string, number>;

  @IsOptional()
  monthlyRevenue?: Map<string, number>;
}
