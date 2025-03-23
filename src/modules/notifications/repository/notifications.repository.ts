import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from '../schema/notification.schema';

@Injectable()
export class NotificationsRepository {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>
  ) {}

  async create(data: Partial<Notification>): Promise<Notification> {
    const created = new this.notificationModel(data);
    return created.save();
  }

  async findById(id: string): Promise<Notification | null> {
    return this.notificationModel.findOne({ notificationId: id });
  }

  async findByEventId(eventId: string): Promise<Notification[]> {
    return this.notificationModel.find({ eventId });
  }

  async update(notificationId: string, updateData: Partial<Notification>): Promise<Notification> {
    const updated = await this.notificationModel.findOneAndUpdate(
      { notificationId },
      updateData,
      { new: true }
    );

    if (!updated) {
      throw new Error(`Notification with id ${notificationId} not found`);
    }

    return updated;
  }

  async delete(notificationId: string): Promise<void> {
    await this.notificationModel.deleteOne({ notificationId });
  }

  async findAll(): Promise<Notification[]> {
    return this.notificationModel.find();
  }
}
