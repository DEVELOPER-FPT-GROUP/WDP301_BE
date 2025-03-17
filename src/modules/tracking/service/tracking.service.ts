import { forwardRef, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { TrackingsRepository } from '../repository/tracking.repository';
import { OrdersService } from '../../orders/service/orders.service';
import { Tracking } from '../schema/tracking.schema';
import { SubscriptionStatus } from '../../orders/schema/order.schema';

@Injectable()
export class TrackingsService {
  private readonly logger = new Logger(TrackingsService.name);

  constructor(
    private readonly trackingsRepository: TrackingsRepository,
    @Inject(forwardRef(() => OrdersService))
    private readonly ordersService: OrdersService,
  ) {}

  /**
   * Lấy tất cả dữ liệu tracking
   */
  async findAll(): Promise<Tracking[]> {
    this.logger.log('[Service] Fetch all trackings');
    return this.trackingsRepository.findAll();
  }

  /**
   * Tăng totalViews khi người dùng truy cập URL
   */
  async incrementTotalViews(): Promise<Tracking> {
    this.logger.log('[Service] Increment total views');
  
    let tracking = await this.trackingsRepository.findOne();
  
    const currentMonth = new Date().toISOString().slice(0, 7); // Get current month in YYYY-MM format
  
    if (!tracking) {
      this.logger.warn('[Service] No tracking found, creating new tracking record');
      tracking = await this.trackingsRepository.create({
        totalViews: 1,
        totalRevenue: 0,
        revenueHistory: [],
        monthlyViews: new Map([[currentMonth, 1]]), // Initialize with 1 view for the current month
        monthlyRevenue: new Map(), // No revenue yet
      });
    } else {
      // Increment the view count for the current month
      tracking.monthlyViews.set(currentMonth, (tracking.monthlyViews.get(currentMonth) || 0) + 1);
  
      // Increment the total view count
      tracking.totalViews += 1;
  
      tracking = await this.trackingsRepository.update(tracking._id.toString(), {
        totalViews: tracking.totalViews,
        monthlyViews: tracking.monthlyViews, // Update the monthly view counts
      });
  
      if (!tracking) {
        this.logger.error('[Service] Failed to update tracking total views');
        throw new Error('Failed to update tracking total views.');
      }
    }
  
    return tracking;
  }
  
  

  /**
   * Cập nhật doanh thu khi trạng thái subscription thay đổi
   */
  async updateRevenueForOrder(orderId: string, newStatus: SubscriptionStatus, price: number): Promise<Tracking> {
    this.logger.log(`[Service] Updating revenue for Order ID: ${orderId}, Status: ${newStatus}`);

    let tracking = await this.trackingsRepository.findOne();

    if (!tracking) {
      this.logger.warn('[Service] No tracking found, creating new tracking record');
      tracking = await this.trackingsRepository.create({
        totalViews: 0,
        totalRevenue: 0,
        revenueHistory: [],
      });
    }

    if (newStatus === SubscriptionStatus.ACTIVE) {
      tracking.revenueHistory.push({
        orderId,
        amount: price,
        status: newStatus,
        timestamp: new Date(),
      });

      tracking.totalRevenue += price;
    }

    const updatedTracking = await this.trackingsRepository.update(tracking._id.toString(), {
      totalRevenue: tracking.totalRevenue,
      revenueHistory: tracking.revenueHistory,
    });

    if (!updatedTracking) {
      this.logger.error(`[Service] Failed to update revenue for order ID: ${orderId}`);
      throw new NotFoundException('Failed to update tracking revenue.');
    }

    this.logger.log(`[Service] Successfully updated revenue for order ID: ${orderId}`);
    return updatedTracking;
  }

  /**
   * Lấy tổng doanh thu theo tháng (có thể lọc theo tháng cụ thể)
   * @param month Chuỗi YYYY-MM để lọc theo tháng cụ thể (tuỳ chọn)
   */
  async getTotalRevenueByMonth(month?: string): Promise<{ month: string; totalRevenue: number }[]> {
    this.logger.log(`[Service] Fetching total revenue by month (Filter: ${month || 'All'})`);
    return this.trackingsRepository.aggregateTotalRevenueByMonth(month);
  }

  /**
   * Lấy tổng lượt xem theo tháng (có thể lọc theo tháng cụ thể)
   * @param month Chuỗi YYYY-MM để lọc theo tháng cụ thể (tuỳ chọn)
   */
  async getTotalViewsByMonth(month?: string): Promise<{ month: string; totalViews: number }[]> {
    this.logger.log(`[Service] Fetching total views by month (Filter: ${month || 'All'})`);
    return this.trackingsRepository.aggregateTotalViewsByMonth(month);
  }

  /**
   * Fetch total revenue and total views for each month (12 months)
   */
  async getYearlyData(): Promise<{ views: number[]; revenue: number[] }> {
    this.logger.log('[Service] Fetching yearly data for views and revenue');
  
    // Fetch tracking data (including views and revenue for all months)
    const tracking = await this.trackingsRepository.findOne();
  
    if (!tracking) {
      return { views: new Array(12).fill(0), revenue: new Array(12).fill(0) };
    }
  
    // Initialize arrays for views and revenue (12 months)
    const views = new Array(12).fill(0);
    const revenue = new Array(12).fill(0);
  
    // Iterate over the last 12 months and aggregate data
    for (let i = 0; i < 12; i++) {
      const month = `2025-${String(i + 1).padStart(2, '0')}`; // Generate months in YYYY-MM format
  
      // Check and assign values to views and revenue
      views[i] = tracking.monthlyViews.get(month) || 0;
      revenue[i] = tracking.monthlyRevenue.get(month) || 0;
    }
  
    return { views, revenue };
  }
  
  
}
