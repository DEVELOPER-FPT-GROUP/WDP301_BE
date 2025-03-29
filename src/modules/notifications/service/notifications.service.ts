import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationRecipientRepository } from '../repository/notification-recipient.repository';
import { NotificationsRepository } from '../repository/notifications.repository';
import { CreateNotificationDto } from '../dto/request/create-notification.dto';
import { NotificationMapper } from '../mapper/notification.mapper';
import { NotificationResponseDto } from '../dto/response/notification-response.dto';
import { SendVia } from '../../../utils/enum';
import { MembersService } from '../../members/service/members.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationRepository: NotificationsRepository,
    private readonly notificationRecipientRepository: NotificationRecipientRepository,
    private readonly membersService: MembersService,
  ) { }

  async create(data: CreateNotificationDto): Promise<NotificationResponseDto> {
    let memberIds =
      (await this.membersService
        .getConnectedMembersFrom(data.senderId))
        .map(m => {
          return m.memberId;
        });

    const notification = await this.notificationRepository.create({
      eventId: data.eventId,
      senderId: data.senderId,
      notificationType: data.notificationType,
      message: data.message,
      scheduledTime: data.scheduledTime,
      expirationTime: data.expirationTime,
    });

    for (const recipientId of memberIds) {
      await this.notificationRecipientRepository.create({
        notificationId: notification.notificationId,
        recipientAccountId: recipientId,
        sentVia: SendVia.In_App,
        isRead: false,
      });
    }

    // Broadcast the notification to all recipients via WebSocket
    const notificationResponse = NotificationMapper.toResponseDto(notification);

    return notificationResponse;
  }

  async getNotificationsByEvent(eventId: string): Promise<NotificationResponseDto[]> {
    const notifications = await this.notificationRepository.findByEventId(eventId);
    if (!notifications.length) {
      throw new NotFoundException('No notifications found for this event.');
    }
    return NotificationMapper.toResponseList(notifications);
  }

  async markNotificationAsRead(recipientId: string): Promise<void> {
    await this.notificationRecipientRepository.markAsRead(recipientId);
    // You could also broadcast this status change to relevant clients if needed
    // this.notificationsGateway.broadcastNotification([recipientId], { type: 'READ_STATUS_CHANGED', recipientId });
  }

  async findAll(): Promise<NotificationResponseDto[]> {
    const notifications = await this.notificationRepository.findAll();
    return NotificationMapper.toResponseList(notifications);
  }

  async findOne(notificationId: string): Promise<NotificationResponseDto> {
    const notification = await this.notificationRepository.findById(notificationId);
    if (!notification) {
      throw new NotFoundException(`Notification with id ${notificationId} not found`);
    }
    return NotificationMapper.toResponseDto(notification);
  }

  async update(notificationId: string, updateData: any): Promise<NotificationResponseDto> {
    const updated = await this.notificationRepository.update(notificationId, updateData);
    return NotificationMapper.toResponseDto(updated);
  }

  async remove(notificationId: string): Promise<void> {
    await this.notificationRepository.delete(notificationId);
  }
}
