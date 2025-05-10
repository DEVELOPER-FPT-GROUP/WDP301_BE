import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: false } })
export class Notification {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, unique: true })
  notification_id: string; // Primary Key

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Event', required: true })
  event_id: string; // Foreign Key referencing Events

  @Prop({ required: true })
  notification_type: string; // Type of notification (e.g., 'info', 'warning', 'alert')

  @Prop({ required: true })
  message: string; // Notification message

  @Prop({ enum: ['email', 'sms', 'push'], required: true })
  sent_via: string; // How the notification was sent

  @Prop({ type: Date, required: true })
  sent_at: Date; // Timestamp when the notification was sent

  @Prop({ default: false })
  is_read: boolean; // Whether the notification has been read
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
