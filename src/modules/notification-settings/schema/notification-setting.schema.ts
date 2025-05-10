import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type NotificationSettingDocument = HydratedDocument<NotificationSetting>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class NotificationSetting {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, unique: true })
  setting_id: string; // Primary Key

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Account', required: true })
  account_id: string; // Foreign Key referencing Accounts

  @Prop({ default: true })
  email_notifications_enabled: boolean; // Email notifications enabled (default: true)

  @Prop({ default: true })
  push_notifications_enabled: boolean; // Push notifications enabled (default: true)
}

export const NotificationSettingSchema = SchemaFactory.createForClass(NotificationSetting);
