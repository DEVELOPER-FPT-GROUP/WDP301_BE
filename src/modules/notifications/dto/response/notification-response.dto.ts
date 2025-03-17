import { NotificationType } from '../../schema/notification.schema';

export class NotificationResponseDto {
  notificationId: string;
  eventId: string;
  senderId: string;
  notificationType: NotificationType;
  message: string;
  recipientAccountIds: string[];
  scheduledTime?: Date;
  expirationTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}
