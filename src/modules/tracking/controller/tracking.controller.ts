import { Body, Controller, Get, Logger, NotFoundException, Param, Put, Query } from '@nestjs/common';
import { TrackingsService } from '../service/tracking.service';
import { ResponseDTO } from 'src/utils/response.dto';
import { TrackingResponse } from '../dto/response/tracking.dto';
import { UseInterceptors } from '@nestjs/common';
import { LoggingInterceptor } from 'src/common/interceptors/logging.interceptor';
import { UpdateTrackingDto } from '../dto/request/tracking-update.dto';

@Controller('trackings')
@UseInterceptors(LoggingInterceptor)
export class TrackingsController {
  private readonly logger = new Logger(TrackingsController.name);

  constructor(private readonly trackingsService: TrackingsService) {}

  @Get()
  async findAll(): Promise<ResponseDTO<TrackingResponse[]>> {
    this.logger.log('[Handler] Fetch All Trackings');
    const trackings = await this.trackingsService.findAll();
    return ResponseDTO.success(trackings, 'Trackings fetched successfully');
  }

  @Put('/:id')
  async updateTracking(
    @Param('id') id: string,
    @Body() updateTrackingDto: UpdateTrackingDto
  ): Promise<ResponseDTO<TrackingResponse>> {
    this.logger.log(`[Handler] Update Tracking ID: ${id}`);
    const updatedTracking = await this.trackingsService.updateTracking(id, updateTrackingDto);
    if (!updatedTracking) {
      throw new NotFoundException(`Tracking with ID ${id} not found`);
    }
    return ResponseDTO.success(updatedTracking, 'Tracking record updated successfully');
  }

  @Get('/increment-view')
  async incrementTotalViews(): Promise<ResponseDTO<TrackingResponse>> {
    this.logger.log('[Handler] Increment Total Views');
    const tracking = await this.trackingsService.incrementTotalViews();
    return ResponseDTO.success(tracking, 'Total views incremented successfully');
  }

  @Get('/revenue-by-month')
  async getTotalRevenueByMonth(@Query('month') month?: string): Promise<ResponseDTO<{ month: string; totalRevenue: number }[]>> {
    this.logger.log(`[Handler] Fetch Total Revenue by Month (Filter: ${month || 'All'})`);
    const revenueData = await this.trackingsService.getTotalRevenueByMonth(month);
    return ResponseDTO.success(revenueData, 'Total revenue by month fetched successfully');
  }

  @Get('/views-by-month')
  async getTotalViewsByMonth(@Query('month') month?: string): Promise<ResponseDTO<{ month: string; totalViews: number }[]>> {
    this.logger.log(`[Handler] Fetch Total Views by Month (Filter: ${month || 'All'})`);
    const viewData = await this.trackingsService.getTotalViewsByMonth(month);
    return ResponseDTO.success(viewData, 'Total views by month fetched successfully');
  }

  /**
   * Fetch total views and revenue for the last 12 months (one for each month)
   */
  @Get('/revenue-orders/summary')
async getRevenueOrdersSummary(): Promise<ResponseDTO<{
    totalRevenue: number;
    totalOrder: number;
    orderInMonth: number;
    revenueInMonth: number;
    revenueInYear: { month: number; value: number }[];
    orderInYear: { month: number; value: number }[];
}>> {
    this.logger.log('[Handler] Fetch Revenue and Order Summary');
    
    const yearlyData = await this.trackingsService.getYearlyData();
    
    return ResponseDTO.success(yearlyData, 'Revenue and order summary fetched successfully');
}

@Get('/families-accounts/summary')
async getFamiliesAccountsSummary(): Promise<ResponseDTO<{
    totalFamilies: number;
    totalAccounts: number;
    totalViews: number;
    viewsInYear: { month: number; value: number }[];
    accountsInYear: { month: number; value: number }[];
}>> {
    this.logger.log('[Handler] Fetch Family, Account, and View Summary');

    const statsData = await this.trackingsService.getFamilyAndAccountStats();

    return ResponseDTO.success(statsData, 'Family, account, and view summary fetched successfully');
}


}
