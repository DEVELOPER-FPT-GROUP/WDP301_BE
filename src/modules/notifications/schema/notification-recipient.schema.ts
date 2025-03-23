import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import * as crypto from 'crypto';

export type NotificationRecipientDocument = HydratedDocument<NotificationRecipient>;

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })
export class NotificationRecipient {
  @Prop()
  recipientId: string; // Auto-generated

  @Prop()
  notificationId: string; // Related Notification ID

  @Prop()
  recipientAccountId: string; // User ID of the recipient

  @Prop()
  sentVia: string;

  @Prop({ default: false })
  isRead: boolean;

  @Prop({ type: Date })
  sentAt?: Date;

  @Prop({ enum: ['Sent', 'Delivered', 'Failed'], default: 'Sent' })
  status: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const NotificationRecipientSchema = SchemaFactory.createForClass(NotificationRecipient);

NotificationRecipientSchema.pre<NotificationRecipientDocument>('save', function (next) {
  if (!this.recipientId) {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    this.recipientId = `RECIP-${timestamp}-${crypto.randomBytes(4).toString('hex')}`;
  }
  next();
});
