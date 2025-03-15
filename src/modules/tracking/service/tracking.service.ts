import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TrackingsRepository } from '../repository/tracking.repository';
import { OrdersService } from '../../orders/service/orders.service';
import { Tracking } from '../schema/tracking.schema';
import { SubscriptionStatus } from '../../orders/schema/order.schema';

@Injectable()
export class TrackingsService {
  constructor(
    private readonly trackingsRepository: TrackingsRepository,
    @Inject(forwardRef(() => OrdersService))
    private readonly ordersService: OrdersService,
  ) {}

  /**
   * Lấy tất cả dữ liệu tracking
   */
  async findAll(): Promise<Tracking[]> {
    return this.trackingsRepository.findAll();
  }

  /**
   * Tăng totalViews khi người dùng truy cập URL
   */
  async incrementTotalViews(): Promise<Tracking> {
    let tracking = await this.trackingsRepository.findOne();
    
    if (!tracking) {
      tracking = await this.trackingsRepository.create({
        totalViews: 1,
        totalRevenue: 0,
        revenueHistory: [],
      });
    } else {
      tracking = await this.trackingsRepository.update(tracking._id.toString(), {
        totalViews: tracking.totalViews + 1,
      });

      if (!tracking) {
        throw new Error("Failed to update tracking total views.");
      }
    }

    return tracking;
  }

  /**
   * Cập nhật doanh thu khi trạng thái subscription thay đổi
   * - Chỉ thêm doanh thu khi subscription chuyển sang `ACTIVE`
   * - Lưu lịch sử doanh thu với orderId, số tiền, trạng thái và thời gian
   */
  async updateRevenueForOrder(orderId: string, newStatus: SubscriptionStatus, price: number): Promise<Tracking> {
    let tracking = await this.trackingsRepository.findOne();
    if (!tracking) {
      tracking = await this.trackingsRepository.create({
        totalViews: 0,
        totalRevenue: 0,
        revenueHistory: [],
      });
    }

    let updatedRevenue = tracking.totalRevenue;

    if (newStatus === SubscriptionStatus.ACTIVE) {
      // Khi đơn hàng được kích hoạt -> Cộng vào tổng doanh thu
      updatedRevenue += price;
      tracking.revenueHistory.push({
        orderId: orderId,
        amount: price,
        status: newStatus,
        timestamp: new Date(),
      });
    }

    // Không giảm doanh thu nếu đơn hàng bị hủy hoặc hết hạn

    tracking = await this.trackingsRepository.update(tracking._id.toString(), {
      totalRevenue: updatedRevenue,
      revenueHistory: tracking.revenueHistory,
    });

    if (!tracking) {
      throw new Error("Failed to update tracking total revenue.");
    }

    return tracking;
  }

  /**
   * Cập nhật tổng doanh thu từ tất cả đơn hàng (chỉ tính đơn hàng active)
   */
  async updateTotalRevenue(): Promise<Tracking> {
    const orders = await this.ordersService.findAll();

    // Tính tổng doanh thu chỉ từ các Subscription đang ACTIVE
    const totalRevenue = orders
      .filter(order => order.status === SubscriptionStatus.ACTIVE)
      .reduce((sum, order) => sum + order.price, 0);

    let tracking = await this.trackingsRepository.findOne();

    if (!tracking) {
      tracking = await this.trackingsRepository.create({
        totalViews: 0,
        totalRevenue,
        revenueHistory: [],
      });
    } else {
      tracking = await this.trackingsRepository.update(tracking._id.toString(), { totalRevenue });

      if (!tracking) {
        throw new Error("Failed to update tracking total revenue.");
      }
    }

    return tracking;
  }
}
