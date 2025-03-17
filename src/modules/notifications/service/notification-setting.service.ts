import { Injectable } from '@nestjs/common';
import { NotificationSettingRepository } from '../repository/notification-setting.repository';
import { NotificationSetting } from '../schema/notification-setting.schema';

@Injectable()
export class NotificationSettingService {
  constructor(private readonly settingRepository: NotificationSettingRepository) {}

  async getUserSettings(accountId: string): Promise<NotificationSetting> {
    let settings = await this.settingRepository.getByAccountId(accountId);

    // If settings do not exist, create default settings
    if (!settings) {
      settings = await this.settingRepository.createDefaultSettings(accountId);
    }
    return settings;
  }

  async updateUserSettings(accountId: string, updateData: Partial<NotificationSetting>): Promise<NotificationSetting> {
    return this.settingRepository.updateSettings(accountId, updateData);
  }
}
