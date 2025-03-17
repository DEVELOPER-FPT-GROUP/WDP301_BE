import { Controller, Get, Post, Patch, Delete, Param, Body, Put } from '@nestjs/common';
import { OrdersService } from '../service/orders.service';
import { CreateOrderDto } from '../dto/request/create-order.dto';
import { UpdateOrderDto } from '../dto/request/update-order.dto';
import { Order, SubscriptionStatus } from '../schema/order.schema';
import { ResponseDTO } from 'src/utils/response.dto';
import { winstonLogger as logger } from 'src/common/winston-logger';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  /**
   * Lấy danh sách tất cả đơn hàng
   */
  @Get()
  async findAll(): Promise<ResponseDTO<Order[]>> {
    logger.info('[Handler] Fetch all orders');
    const orders = await this.ordersService.findAll();
    return ResponseDTO.success(orders, 'Orders fetched successfully');
  }

  /**
   * Lấy thông tin đơn hàng theo ID
   */
  @Get(':id')
  async findById(@Param('id') id: string): Promise<ResponseDTO<Order>> {
    logger.info(`[Handler] Fetch Order: ${id}`);
    const order = await this.ordersService.findById(id);
    return ResponseDTO.success(order, 'Order fetched successfully');
  }

  /**
   * Tạo mới một đơn hàng
   * - Nếu trạng thái ban đầu là `ACTIVE`, doanh thu được cập nhật ngay.
   */
  @Post()
  async create(@Body() data: CreateOrderDto): Promise<ResponseDTO<Order>> {
    logger.info('[Handler] Create Order called');
    const order = await this.ordersService.create(data);
    return ResponseDTO.success(order, 'Order created successfully');
  }

  /**
   * Cập nhật thông tin đơn hàng (không thay đổi trạng thái subscription)
   * - Nếu giá thay đổi, doanh thu sẽ được cập nhật.
   */
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateData: UpdateOrderDto): Promise<ResponseDTO<Order>> {
    logger.info(`[Handler] Update Order: ${id}`);
    const order = await this.ordersService.update(id, updateData);
    return ResponseDTO.success(order, 'Order updated successfully');
  }

  /**
   * Cập nhật trạng thái Subscription
   * - Nếu trạng thái mới là `ACTIVE`, cập nhật doanh thu.
   * - Nếu trạng thái là `CANCELLED` hoặc `EXPIRED`, doanh thu vẫn giữ nguyên.
   */
  @Put(':id/status')
  async updateSubscriptionStatus(
    @Param('id') id: string,
    @Body('status') status: SubscriptionStatus
  ): Promise<ResponseDTO<Order>> {
    logger.info(`[Handler] Update Subscription Status for Order: ${id}`);
    const order = await this.ordersService.updateSubscriptionStatus(id, status);
    return ResponseDTO.success(order, 'Subscription status updated successfully');
  }

  /**
   * Xóa đơn hàng
   * - Doanh thu không thay đổi vì subscription đã được xử lý trước đó.
   */
  @Delete(':id')
  async delete(@Param('id') id: string): Promise<ResponseDTO<boolean>> {
    logger.info(`[Handler] Delete Order: ${id}`);
    const result = await this.ordersService.delete(id);
    return ResponseDTO.success(result, 'Order deleted successfully');
  }
}
