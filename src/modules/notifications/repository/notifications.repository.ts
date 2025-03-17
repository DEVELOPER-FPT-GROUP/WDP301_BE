
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from '../schema/notification.schema';

@Injectable()
export class NotificationRepository {
  constructor(@InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>) {}

  async create(notification: Partial<Notification>): Promise<Notification> {
    return await new this.notificationModel(notification).save();
  }

  async findById(notificationId: string): Promise<Notification | null> {
    return this.notificationModel.findOne({ notificationId }).exec();
  }

  async findByEventId(eventId: string): Promise<Notification[]> {
    return this.notificationModel.find({ eventId }).exec();
  }

  async update(notificationId: string, updateData: Partial<Notification>): Promise<Notification | null> {
    return this.notificationModel.findOneAndUpdate({ notificationId }, updateData, { new: true }).exec();
  }

  async delete(notificationId: string): Promise<boolean> {
    const result = await this.notificationModel.deleteOne({ notificationId }).exec();
    return result.deletedCount > 0;
  }
}
