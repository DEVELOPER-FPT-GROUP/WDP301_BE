import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotificationRecipient, NotificationRecipientDocument } from '../schema/notification-recipient.schema';

@Injectable()
export class NotificationRecipientRepository {
  constructor(@InjectModel(NotificationRecipient.name) private recipientModel: Model<NotificationRecipientDocument>) {}

  async create(recipient: Partial<NotificationRecipient>): Promise<NotificationRecipient> {
    return await new this.recipientModel(recipient).save();
  }

  async findByNotificationId(notificationId: string): Promise<NotificationRecipient[]> {
    return this.recipientModel.find({ notificationId }).exec();
  }

  async findByRecipientAccountId(accountId: string): Promise<NotificationRecipient[]> {
    return this.recipientModel.find({ recipientAccountId: accountId }).exec();
  }

  async markAsRead(recipientId: string): Promise<NotificationRecipient | null> {
    return this.recipientModel.findOneAndUpdate({ recipientId }, { isRead: true }, { new: true }).exec();
  }

  async updateStatus(recipientId: string, status: 'Sent' | 'Delivered' | 'Failed'): Promise<NotificationRecipient | null> {
    return this.recipientModel.findOneAndUpdate({ recipientId }, { status }, { new: true }).exec();
  }
}
