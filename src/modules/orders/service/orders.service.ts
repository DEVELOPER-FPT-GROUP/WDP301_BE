import { Injectable, Inject, forwardRef, NotFoundException } from '@nestjs/common';
import { OrdersRepository } from '../repository/orders.repository';
import { CreateOrderDto } from '../dto/request/create-order.dto';
import { UpdateOrderDto } from '../dto/request/update-order.dto';
import { Order, SubscriptionStatus } from '../schema/order.schema';
import { TrackingsService } from 'src/modules/tracking/service/tracking.service';
import { PaginationDTO } from 'src/utils/pagination.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepository: OrdersRepository,
    @Inject(forwardRef(() => TrackingsService))
    private readonly trackingsService: TrackingsService,
  ) { }
  async create(data: CreateOrderDto): Promise<Order> {
    // Create the new order using the repository
    const newOrder = await this.ordersRepository.create(data);

    // If the order status is ACTIVE, update the revenue
    if (newOrder.status === SubscriptionStatus.ACTIVE) {
      await this.trackingsService.updateRevenueForOrder(newOrder._id.toString(), newOrder.status, newOrder.price);
    }

    // Return the newly created order
    return newOrder;
  }

  async findById(id: string): Promise<Order> {
    const order = await this.ordersRepository.findById(id);
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }

  async findAll(): Promise<Order[]> {
    return this.ordersRepository.findAll();
  }

  /**
   * Lấy danh sách đơn hàng có phân trang và tìm kiếm
   */
  async findAllPaginated(options: { page: number; limit: number; search: string; sortByDate: boolean }): Promise<PaginationDTO<Order>> {
    const { page = 1, limit = 10, search = '', sortByDate = false } = options;

    const filters: any = {};

    if (search) {
      const regex = new RegExp(search, 'i');
      filters.$or = [
        { fullName: regex },
        { transactionId: regex },
      ];
    }

    const sortOptions = sortByDate ? { createdAt: 1 } : { createdAt: -1 };

    // Get paginated data
    const { records, total } = await this.ordersRepository.findPaginated(filters, page, limit, sortOptions);

    return PaginationDTO.create(records, total, page, limit);
  }

  async update(id: string, updateData: UpdateOrderDto): Promise<Order> {
    const order = await this.ordersRepository.findById(id);
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    const updatedOrder = await this.ordersRepository.update(id, updateData);
    if (!updatedOrder) {
      throw new NotFoundException(`Failed to update order with ID ${id}`);
    }

    if (updateData.price !== undefined && order.status === SubscriptionStatus.ACTIVE) {
      await this.trackingsService.updateRevenueForOrder(id, order.status, updateData.price);
    }

    return updatedOrder;
  }

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

    const previousStatus = order.status; // Lưu trạng thái trước khi cập nhật
    const updatedOrder = await this.ordersRepository.update(id, { status: newStatus });

    if (!updatedOrder) {
      throw new NotFoundException(`Failed to update subscription status for order ID ${id}`);
    }

    // Nếu trạng thái thay đổi từ ACTIVE → khác (cần xóa revenue cũ)
    if (previousStatus === SubscriptionStatus.ACTIVE && newStatus !== SubscriptionStatus.ACTIVE) {
      await this.trackingsService.removeRevenueForOrder(id);
    }

    // Nếu trạng thái thay đổi từ khác → ACTIVE (cần thêm revenue mới)
    if (previousStatus !== SubscriptionStatus.ACTIVE && newStatus === SubscriptionStatus.ACTIVE) {
      await this.trackingsService.updateRevenueForOrder(id, newStatus, order.price);
    }

    return updatedOrder;
  }

}
