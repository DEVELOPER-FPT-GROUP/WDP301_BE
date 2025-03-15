import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type OrderDocument = HydratedDocument<Order>;

export enum SubscriptionType {
  STANDARD = 'standard',
  PREMIUM = 'premium',
}

export enum SubscriptionStatus {
  PENDING = 'pending',       // Chờ thanh toán hoặc xử lý
  ACTIVE = 'active',         // Đã kích hoạt subscription
  EXPIRED = 'expired',       // Hết hạn
  CANCELLED = 'cancelled',   // Đã hủy đăng ký
}

@Schema({ timestamps: true })
export class Order {
  _id: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  phoneNumber: string;

  @Prop({ 
    type: String, 
    enum: SubscriptionType, 
    default: SubscriptionType.STANDARD 
  })
  subscription: SubscriptionType;

  @Prop({ required: true })
  price: number; 

  @Prop({ 
    type: String, 
    enum: SubscriptionStatus, 
    default: SubscriptionStatus.PENDING 
  })
  status: SubscriptionStatus; 

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
