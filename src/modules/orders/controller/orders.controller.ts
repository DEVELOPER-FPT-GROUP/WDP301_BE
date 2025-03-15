import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { OrdersService } from '../service/orders.service';
import { CreateOrderDto } from '../dto/request/create-order.dto';
import { UpdateOrderDto } from '../dto/request/update-order.dto';
import { Order, SubscriptionStatus } from '../schema/order.schema';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * Lấy danh sách tất cả đơn hàng
   */
  @Get()
  async findAll(): Promise<Order[]> {
    return this.ordersService.findAll();
  }

  /**
   * Lấy thông tin đơn hàng theo ID
   */
  @Get(':id')
  async findById(@Param('id') id: string): Promise<Order> {
    return this.ordersService.findById(id);
  }

  /**
   * Tạo mới một đơn hàng
   * - Nếu trạng thái ban đầu là `ACTIVE`, doanh thu được cập nhật ngay.
   */
  @Post()
  async create(@Body() data: CreateOrderDto): Promise<Order> {
    return this.ordersService.create(data);
  }

  /**
   * Cập nhật thông tin đơn hàng (không thay đổi trạng thái subscription)
   * - Nếu giá thay đổi, doanh thu sẽ được cập nhật.
   */
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateData: UpdateOrderDto): Promise<Order> {
    return this.ordersService.update(id, updateData);
  }

  /**
   * Cập nhật trạng thái Subscription
   * - Nếu trạng thái mới là `ACTIVE`, cập nhật doanh thu.
   * - Nếu trạng thái là `CANCELLED` hoặc `EXPIRED`, doanh thu vẫn giữ nguyên.
   */
  @Patch(':id/status')
  async updateSubscriptionStatus(
    @Param('id') id: string,
    @Body('status') status: SubscriptionStatus
  ): Promise<Order> {
    return this.ordersService.updateSubscriptionStatus(id, status);
  }

  /**
   * Xóa đơn hàng
   * - Doanh thu không thay đổi vì subscription đã được xử lý trước đó.
   */
  @Delete(':id')
  async delete(@Param('id') id: string): Promise<boolean> {
    return this.ordersService.delete(id);
  }
}
