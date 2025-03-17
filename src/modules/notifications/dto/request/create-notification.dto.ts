import { IsEnum, IsNotEmpty, IsOptional, IsArray } from 'class-validator';
import { NotificationType } from '../schema/notification.schema';

export class CreateNotificationDto {
  @IsNotEmpty()
  eventId: string;

  @IsNotEmpty()
  senderId: string; // User who created the notification

  @IsEnum(NotificationType)
  notificationType: NotificationType;

  @IsNotEmpty()
  message: string;

  @IsArray()
  @IsNotEmpty()
  recipientAccountIds: string[]; // List of recipients

  @IsOptional()
  scheduledTime?: Date;

  @IsOptional()
  expirationTime?: Date;
}
