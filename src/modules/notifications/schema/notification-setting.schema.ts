import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import crypto from 'crypto';

export type NotificationSettingDocument = HydratedDocument<NotificationSetting>;

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })
export class NotificationSetting {
  @Prop({ required: true, unique: true, index: true })
  settingId: string; // Auto-generated

  @Prop({ required: true, unique: true }) // Each user has one setting
  accountId: string;

  @Prop({ default: true })
  emailNotificationsEnabled: boolean;

  @Prop({ default: true })
  pushNotificationsEnabled: boolean;

  @Prop({ default: 30 })
  preNotification: number;

  @Prop({ enum: ['Minutes', 'Hours', 'Days'], default: 'Minutes' })
  preNotificationUnit: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const NotificationSettingSchema = SchemaFactory.createForClass(NotificationSetting);

NotificationSettingSchema.pre<NotificationSettingDocument>('save', function (next) {
  if (!this.settingId) {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    this.settingId = `SET-${timestamp}-${crypto.randomBytes(4).toString('hex')}`;
  }
  next();
});
