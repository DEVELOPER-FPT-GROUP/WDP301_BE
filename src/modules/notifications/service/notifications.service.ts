import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationRecipientRepository } from '../repository/notification-recipient.repository';
import { Notification, NotificationType } from '../schema/notification.schema';
import { NotificationRepository } from '../repository/notifications.repository';
import { CreateNotificationDto } from '../dto/request/create-notification.dto';


@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly notificationRecipientRepository: NotificationRecipientRepository
  ) {}

  async createNotification(data: CreateNotificationDto): Promise<Notification> {
    // Create a new notification
    const notification = await this.notificationRepository.create({
      eventId: data.eventId,
      senderId: data.senderId,
      notificationType: data.notificationType,
      message: data.message,
      scheduledTime: data.scheduledTime,
      expirationTime: data.expirationTime,
    });

    // Create recipient records for each user
    for (const recipientId of data.recipientAccountIds) {
      await this.notificationRecipientRepository.create({
        notificationId: notification.notificationId,
        recipientAccountId: recipientId,
        sentVia: 'In-App',
        isRead: false,
      });
    }

    return notification;
  }

  async getNotificationsByEvent(eventId: string): Promise<Notification[]> {
    const notifications = await this.notificationRepository.findByEventId(eventId);
    if (!notifications.length) {
      throw new NotFoundException('No notifications found for this event.');
    }
    return notifications;
  }

  async markNotificationAsRead(recipientId: string): Promise<void> {
    await this.notificationRecipientRepository.markAsRead(recipientId);
  }
}
