import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotificationSetting, NotificationSettingDocument } from '../schema/notification-setting.schema';

@Injectable()
export class NotificationSettingRepository {
  constructor(@InjectModel(NotificationSetting.name) private settingModel: Model<NotificationSettingDocument>) {}

  async getByAccountId(accountId: string): Promise<NotificationSetting | null> {
    return this.settingModel.findOne({ accountId }).exec();
  }

  async updateSettings(accountId: string, updateData: Partial<NotificationSetting>): Promise<NotificationSetting> {
    return this.settingModel.findOneAndUpdate({ accountId }, updateData, { new: true, upsert: true }).exec();
  }

  async createDefaultSettings(accountId: string): Promise<NotificationSetting> {
    return await new this.settingModel({
      accountId,
      emailNotificationsEnabled: true,
      pushNotificationsEnabled: true,
      preNotification: 30,
      preNotificationUnit: 'Minutes',
    }).save();
  }
}
