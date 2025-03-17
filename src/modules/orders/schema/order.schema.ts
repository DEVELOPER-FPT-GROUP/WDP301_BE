import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type OrderDocument = HydratedDocument<Order>;

export enum SubscriptionType {
  SIX_PEOPLE = "six_people",
  FIFTEEN_PEOPLE = "fifteen_people",
  THIRTY_PEOPLE = "thirty_people",
  FIFTY_PEOPLE = "fifty_people",
  NO_LIMIT = "no_limit",
}


export enum SubscriptionStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

@Schema({ timestamps: true })
export class Order {
  _id: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  phoneNumber: string;

  @Prop({ required: true })
  transactionId: string;

  @Prop({
    type: String,
    enum: SubscriptionType,
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
