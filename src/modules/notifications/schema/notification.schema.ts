import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import * as crypto from 'crypto';

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })
export class Notification {
  @Prop()
  notificationId: string; // Auto-generated

  @Prop()
  eventId: string; // Related Event ID

  @Prop()
  senderId: string; // The user who created the notification

  @Prop()
  notificationType: string;

  @Prop()
  message: string;

  @Prop({ type: Date })
  scheduledTime?: Date;

  @Prop({ type: Date })
  expirationTime?: Date;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.pre<NotificationDocument>('save', function (next) {
  if (!this.notificationId) {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    this.notificationId = `NOTIF-${timestamp}-${crypto.randomBytes(4).toString('hex')}`;
  }
  next();
});
