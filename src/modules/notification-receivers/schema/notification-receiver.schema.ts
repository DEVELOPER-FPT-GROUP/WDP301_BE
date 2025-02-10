import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type NotificationReceiverDocument = HydratedDocument<NotificationReceiver>;

@Schema({ timestamps: true }) // Automatically adds createdAt and updatedAt
export class NotificationReceiver {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, unique: true })
  notification_id: string; // Primary Key

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Account', required: true })
  recipient_account_id: string; // Foreign Key referencing Accounts
}

export const NotificationReceiverSchema = SchemaFactory.createForClass(NotificationReceiver);
