import { Controller, Get, Patch } from '@nestjs/common';
import { TrackingsService } from '../service/tracking.service';
import { Tracking } from '../schema/tracking.schema';

@Controller('trackings')
export class TrackingsController {
  constructor(private readonly trackingsService: TrackingsService) {}

  /**
   * Lấy tất cả dữ liệu tracking
   */
  @Get()
  async findAll(): Promise<Tracking[]> {
    return this.trackingsService.findAll();
  }

  /**
   * Cập nhật `totalViews` khi người dùng truy cập URL
   */
  @Get('/increment-view')
  async incrementTotalViews(): Promise<Tracking> {
    return this.trackingsService.incrementTotalViews();
  }

  /**
   * Cập nhật `totalRevenue` thủ công (nếu cần)
   */
  @Patch('/update-revenue')
  async updateTotalRevenue(): Promise<Tracking> {
    return this.trackingsService.updateTotalRevenue();
  }
}
