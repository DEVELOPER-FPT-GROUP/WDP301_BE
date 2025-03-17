import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import crypto from 'crypto';

export type NotificationDocument = HydratedDocument<Notification>;

export enum NotificationType {
  EVENT_INVITATION = 'Event Invitation',
  EVENT_UPDATE = 'Event Update',
  GENERAL_MESSAGE = 'General Message',
}

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })
export class Notification {
  @Prop({ required: true, unique: true, index: true })
  notificationId: string; // Auto-generated

  @Prop({ required: true })
  eventId: string; // Related Event ID

  @Prop({ required: true })
  senderId: string; // The user who created the notification

  @Prop({ required: true, enum: NotificationType })
  notificationType: NotificationType;

  @Prop({ required: true })
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
