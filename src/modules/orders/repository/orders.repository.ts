import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from '../schema/order.schema';
import { CreateOrderDto } from '../dto/request/create-order.dto';
import { UpdateOrderDto } from '../dto/request/update-order.dto';

@Injectable()
export class OrdersRepository {
  constructor(@InjectModel(Order.name) private orderModel: Model<OrderDocument>) {}

  async findById(id: string): Promise<Order | null> {
    return this.orderModel.findById(id).exec();
  }

  async create(data: CreateOrderDto): Promise<Order> {
    const newOrder = new this.orderModel(data);
    return newOrder.save();
  }

  async update(id: string, updateData: UpdateOrderDto): Promise<Order | null> {
    return this.orderModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.orderModel.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }

  async findAll(): Promise<Order[]> {
    return this.orderModel.find().sort({ createdAt: -1 }).exec();
  }

  // Method for pagination and search functionality
  async findPaginated(
    filters: any, 
    page: number, 
    limit: number, 
    sortOptions: any = {}
  ): Promise<{ records: Order[]; total: number }> {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.orderModel.find(filters).sort(sortOptions).skip(skip).limit(limit).select('-__v').lean().exec(),
      this.orderModel.countDocuments(filters),
    ]);

    return { records: orders, total };
  }
  
  
}
