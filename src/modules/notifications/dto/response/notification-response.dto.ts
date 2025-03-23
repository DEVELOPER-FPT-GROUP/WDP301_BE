export class NotificationResponseDto {
  notificationId: string;
  eventId: string;
  senderId: string;
  notificationType: string;
  message: string;
  scheduledTime?: Date;
  expirationTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}
