import { Injectable, Inject, forwardRef, NotFoundException } from '@nestjs/common';
import { OrdersRepository } from '../repository/orders.repository';
import { CreateOrderDto } from '../dto/request/create-order.dto';
import { UpdateOrderDto } from '../dto/request/update-order.dto';
import { Order, SubscriptionStatus } from '../schema/order.schema';
import { TrackingsService } from 'src/modules/tracking/service/tracking.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepository: OrdersRepository,

    @Inject(forwardRef(() => TrackingsService)) // Avoid circular dependency
    private readonly trackingsService: TrackingsService,
  ) {}

  /**
   * Lấy thông tin đơn hàng theo ID
   */
  async findById(id: string): Promise<Order> {
    const order = await this.ordersRepository.findById(id);
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }

  /**
   * Lấy danh sách tất cả đơn hàng
   */
  async findAll(): Promise<Order[]> {
    return this.ordersRepository.findAll();
  }

  /**
   * Tạo mới một đơn hàng
   * - Nếu trạng thái ban đầu là `ACTIVE`, doanh thu được cập nhật ngay.
   */
  async create(data: CreateOrderDto): Promise<Order> {
    const order = await this.ordersRepository.create(data);

    // Nếu đơn hàng đã được kích hoạt (ACTIVE) ngay khi tạo -> Cập nhật doanh thu
    if (order.status === SubscriptionStatus.ACTIVE) {
      await this.trackingsService.updateRevenueForOrder(order._id.toString(), order.status, order.price);
    }

    return order;
  }

  /**
   * Cập nhật thông tin đơn hàng (không thay đổi trạng thái subscription)
   * - Nếu giá thay đổi, doanh thu sẽ được cập nhật.
   */
  async update(id: string, updateData: UpdateOrderDto): Promise<Order> {
    const order = await this.ordersRepository.findById(id);
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    const updatedOrder = await this.ordersRepository.update(id, updateData);
    if (!updatedOrder) {
      throw new NotFoundException(`Failed to update order with ID ${id}`);
    }

    // Nếu giá thay đổi, cần cập nhật lại doanh thu
    if (updateData.price !== undefined && order.status === SubscriptionStatus.ACTIVE) {
      await this.trackingsService.updateTotalRevenue();
    }

    return updatedOrder;
  }

  /**
   * Cập nhật trạng thái của Subscription
   * - Nếu trạng thái mới là `ACTIVE`, cập nhật doanh thu.
   * - Nếu trạng thái là `CANCELLED` hoặc `EXPIRED`, doanh thu vẫn giữ nguyên.
   */
  async updateSubscriptionStatus(id: string, newStatus: SubscriptionStatus): Promise<Order> {
    const order = await this.ordersRepository.findById(id);
    if (!order) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }

    const updatedOrder = await this.ordersRepository.update(id, { status: newStatus });
    if (!updatedOrder) {
      throw new NotFoundException(`Failed to update subscription status for order ID ${id}`);
    }

    // Cập nhật doanh thu nếu trạng thái mới là `ACTIVE`
    if (newStatus === SubscriptionStatus.ACTIVE) {
      await this.trackingsService.updateRevenueForOrder(id, newStatus, order.price);
    }

    return updatedOrder;
  }

  /**
   * Xóa đơn hàng
   * - Doanh thu không thay đổi vì subscription đã được xử lý trước đó.
   */
  async delete(id: string): Promise<boolean> {
    const order = await this.ordersRepository.findById(id);
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    const isDeleted = await this.ordersRepository.delete(id);
    if (!isDeleted) {
      throw new NotFoundException(`Failed to delete order with ID ${id}`);
    }

    return isDeleted;
  }
}
