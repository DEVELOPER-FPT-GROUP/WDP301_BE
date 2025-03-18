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

  @Prop({ required: true, default: 0 })
  totalOrders: number; 

  @Prop({ type: [RevenueEntry] })
  revenueHistory: RevenueEntry[];

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;

  // Use a Map to track views for each month (YYYY-MM format)
  @Prop({ type: Map, of: Number, default: {} })
  monthlyViews: Map<string, number>; // Track views per month for each year (e.g., "2025-01" for Jan 2025)

  // Use a Map to track revenue for each month (YYYY-MM format)
  @Prop({ type: Map, of: Number, default: {} })
  monthlyRevenue: Map<string, number>; // Track revenue per month for each year (e.g., "2025-01" for Jan 2025)

  @Prop({ type: Map, of: Number, default: {} })
  monthlyOrders: Map<string, number>; // Track orders per month for each year (e.g., "2025-01" for Jan 2025)
}

export const TrackingSchema = SchemaFactory.createForClass(Tracking);
