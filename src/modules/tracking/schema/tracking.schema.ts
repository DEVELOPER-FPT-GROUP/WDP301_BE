import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'; 
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type TrackingDocument = HydratedDocument<Tracking>;

export class RevenueEntry {
  @Prop({ required: true })
  orderId: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  status: string; // Status when revenue was added

  @Prop({ default: Date.now })
  timestamp: Date;
}

@Schema({ timestamps: true })
export class Tracking {
  _id: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, default: 0 })
  totalViews: number;

  @Prop({ required: true, default: 0 })
  totalRevenue: number;

  @Prop({ type: [RevenueEntry] }) 
  revenueHistory: RevenueEntry[];

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const TrackingSchema = SchemaFactory.createForClass(Tracking);
