import { Notification } from '../schema/notification.schema';
import { NotificationResponseDto } from '../dto/response/notification-response.dto';

export class NotificationMapper {
  static toDto(notification: Notification): NotificationResponseDto {
    return {
      notificationId: notification.notificationId,
      eventId: notification.eventId,
      senderId: notification.senderId,
      notificationType: notification.notificationType,
      message: notification.message,
      scheduledTime: notification.scheduledTime,
      expirationTime: notification.expirationTime,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    };
  }

  static toResponseDto(notification: Notification): NotificationResponseDto {
    return {
      notificationId: notification.notificationId,
      eventId: notification.eventId,
      senderId: notification.senderId,
      notificationType: notification.notificationType,
      message: notification.message,
      scheduledTime: notification.scheduledTime,
      expirationTime: notification.expirationTime,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    };
  }

  static toResponseList(notifications: Notification[]): NotificationResponseDto[] {
    return notifications.map(this.toResponseDto);
  }

  static toEntity(dto: NotificationResponseDto): Notification {
    const entity = new Notification();
    entity.notificationId = dto.notificationId;
    entity.eventId = dto.eventId;
    entity.senderId = dto.senderId;
    entity.notificationType = dto.notificationType as any;
    entity.message = dto.message;
    entity.scheduledTime = dto.scheduledTime;
    entity.expirationTime = dto.expirationTime;
    entity.createdAt = dto.createdAt;
    entity.updatedAt = dto.updatedAt;
    return entity;
  }
}
