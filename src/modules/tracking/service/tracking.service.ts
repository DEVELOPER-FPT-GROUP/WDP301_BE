import { forwardRef, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { TrackingsRepository } from '../repository/tracking.repository';
import { Tracking } from '../schema/tracking.schema';
import { SubscriptionStatus } from '../../orders/schema/order.schema';
import { FamiliesService } from 'src/modules/families/service/families.service';

@Injectable()
export class TrackingsService {
  private readonly logger = new Logger(TrackingsService.name);

  constructor(
    private readonly trackingsRepository: TrackingsRepository,
    @Inject(forwardRef(() => FamiliesService)) // ✅ Fix circular dependency
    private readonly familiesService: FamiliesService
  ) { }

  /**
   * Lấy tất cả dữ liệu tracking
   */
  async findAll(): Promise<Tracking[]> {
    this.logger.log('[Service] Fetch all trackings');
    return this.trackingsRepository.findAll();
  }


  async findOne(): Promise<Tracking | null> {
    return this.trackingsRepository.findOne();
  }

  async create(data: Partial<Tracking>): Promise<Tracking> {
    return this.trackingsRepository.create(data);
  }

  async updateTracking(id: string, updateData: Partial<Tracking>): Promise<Tracking | null> {
    this.logger.log(`[Service] Updating tracking record with ID: ${id}`);

    const updatedTracking = await this.trackingsRepository.update(id, updateData);

    if (!updatedTracking) {
      this.logger.error(`[Service] Failed to update tracking record with ID: ${id}`);
      throw new NotFoundException(`Tracking record with ID ${id} not found.`);
    }

    this.logger.log(`[Service] Successfully updated tracking record with ID: ${id}`);
    return updatedTracking;
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
  async updateRevenueForOrder(
    orderId: string,
    newStatus: SubscriptionStatus,
    price: number
  ): Promise<Tracking> {
    this.logger.log(`[Service] Updating revenue for Order ID: ${orderId}, Status: ${newStatus}`);

    let tracking = await this.trackingsRepository.findOne();

    if (!tracking) {
      this.logger.warn('[Service] No tracking found, creating new tracking record');
      tracking = await this.trackingsRepository.create({
        totalViews: 0,
        totalRevenue: 0,
        revenueHistory: [],
        monthlyRevenue: new Map(),
      });
    }

    if (newStatus === SubscriptionStatus.ACTIVE) {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format (2025-03)

      tracking.revenueHistory.push({
        orderId,
        amount: price,
        status: newStatus,
        timestamp: new Date(),
      });

      tracking.totalRevenue += price;

      // ✅ Ensure `monthlyRevenue` is updated correctly
      tracking.monthlyRevenue.set(
        currentMonth,
        (tracking.monthlyRevenue.get(currentMonth) || 0) + price
      );
    }

    const updatedTracking = await this.trackingsRepository.update(tracking._id.toString(), {
      totalRevenue: tracking.totalRevenue,
      revenueHistory: tracking.revenueHistory,
      monthlyRevenue: tracking.monthlyRevenue, // ✅ Update `monthlyRevenue`
    });

    if (!updatedTracking) {
      this.logger.error(`[Service] Failed to update revenue for order ID: ${orderId}`);
      throw new NotFoundException('Failed to update tracking revenue.');
    }

    this.logger.log(`[Service] Successfully updated revenue for order ID: ${orderId}`);
    return updatedTracking;
  }

  async removeRevenueForOrder(orderId: string): Promise<Tracking> {
    this.logger.log(`[Service] Removing revenue for Order ID: ${orderId}`);

    let tracking = await this.trackingsRepository.findOne();
    if (!tracking) {
      this.logger.warn('[Service] No tracking found, skipping revenue removal');
      throw new NotFoundException('Tracking not found.');
    }

    // Lọc bỏ orderId khỏi revenueHistory
    tracking.revenueHistory = tracking.revenueHistory.filter(entry => entry.orderId !== orderId);

    // Cập nhật totalRevenue
    tracking.totalRevenue = tracking.revenueHistory.reduce((sum, entry) => sum + entry.amount, 0);

    const updatedTracking = await this.trackingsRepository.update(tracking._id.toString(), {
      totalRevenue: tracking.totalRevenue,
      revenueHistory: tracking.revenueHistory,
    });

    if (!updatedTracking) {
      this.logger.error(`[Service] Failed to remove revenue for order ID: ${orderId}`);
      throw new NotFoundException('Failed to update tracking revenue.');
    }

    this.logger.log(`[Service] Successfully removed revenue for order ID: ${orderId}`);
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
  async getYearlyData(): Promise<{
    totalRevenue: number;
    totalOrder: number;
    orderInMonth: number;
    revenueInMonth: number;
    revenueInYear: { month: number; value: number }[];
    orderInYear: { month: number; value: number }[];
  }> {
    this.logger.log('[Service] Fetching yearly data for revenue and orders');

    // Fetch tracking data
    const tracking = await this.trackingsRepository.findOne();

    if (!tracking) {
      return {
        totalRevenue: 0,
        totalOrder: 0,
        orderInMonth: 0,
        revenueInMonth: 0,
        revenueInYear: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, value: 0 })),
        orderInYear: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, value: 0 })),
      };
    }

    // Get current month and year
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // 1-based month (Jan = 1)
    const currentYear = currentDate.getFullYear();
    const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

    // Extract total values
    const totalRevenue = tracking.totalRevenue || 0;
    const totalOrder = tracking.totalOrders || 0;
    const orderInMonth = tracking.monthlyOrders?.get(currentMonthKey) || 0;
    const revenueInMonth = tracking.monthlyRevenue?.get(currentMonthKey) || 0;

    // Prepare revenue and order breakdowns for each month
    const revenueInYear = Array.from({ length: 12 }, (_, i) => {
      const monthKey = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
      return { month: i + 1, value: tracking.monthlyRevenue?.get(monthKey) || 0 };
    });

    const orderInYear = Array.from({ length: 12 }, (_, i) => {
      const monthKey = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
      return { month: i + 1, value: tracking.monthlyOrders?.get(monthKey) || 0 };
    });

    return {
      totalRevenue,
      totalOrder,
      orderInMonth,
      revenueInMonth,
      revenueInYear,
      orderInYear,
    };
  }

  async getFamilyAndAccountStats(): Promise<{
    totalFamilies: number;
    totalAccounts: number;
    totalViews: number;
    accountsInMonth: number;
    viewsInYear: { month: number; value: number }[];
    accountsInYear: { month: number; value: number }[];
  }> {
    this.logger.log('[Service] Fetching yearly data for families, accounts, and views');

    // Fetch tracking data
    const tracking = await this.trackingsRepository.findOne();

    if (!tracking) {
      return {
        totalFamilies: 0,
        totalAccounts: 0,
        totalViews: 0,
        accountsInMonth: 0,
        viewsInYear: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, value: 0 })),
        accountsInYear: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, value: 0 })),
      };
    }

    // Get total families and accounts from their respective services
    const totalFamilies = (await this.familiesService.getAllFamilies()).length;
    const totalAccounts = tracking.totalAccounts || 0;

    // Get current year
    const currentYear = new Date().getFullYear();

    // Prepare viewsInYear and accountsInYear breakdowns for each month
    const viewsInYear = Array.from({ length: 12 }, (_, i) => {
      const monthKey = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
      return { month: i + 1, value: tracking.monthlyViews?.get(monthKey) || 0 };
    });

    const accountsInYear = Array.from({ length: 12 }, (_, i) => {
      const monthKey = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
      return { month: i + 1, value: tracking.monthlyAccounts?.get(monthKey) || 0 };
    });

    return {
      totalFamilies,
      totalAccounts,
      totalViews: tracking.totalViews || 0,
      accountsInMonth: tracking.monthlyAccounts?.get(`${currentYear}-${String(new Date().getMonth() + 1).padStart(2, '0')}`) || 0,
      viewsInYear,
      accountsInYear,
    };
  }


  async updateAccountStats(): Promise<Tracking> {
    this.logger.log(`[Service] Updating account statistics`);

    let tracking = await this.trackingsRepository.findOne();
    if (!tracking) {
      this.logger.warn('[Service] No tracking found, creating new tracking record');
      tracking = await this.trackingsRepository.create({
        totalAccounts: 1,
        monthlyAccounts: new Map(),
      });
    } else {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format (2025-03)

      // Increment total accounts
      tracking.totalAccounts += 1;

      // Update monthly accounts count
      tracking.monthlyAccounts.set(
        currentMonth,
        (tracking.monthlyAccounts.get(currentMonth) || 0) + 1
      );

      await this.trackingsRepository.update(tracking._id.toString(), {
        totalAccounts: tracking.totalAccounts,
        monthlyAccounts: tracking.monthlyAccounts,
      });
    }

    return tracking;
  }


}
