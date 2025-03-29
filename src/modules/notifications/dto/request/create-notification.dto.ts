import { IsEnum, IsNotEmpty, IsOptional, IsArray } from 'class-validator';
import { NotificationType } from '../../../../utils/enum';

export class CreateNotificationDto {
  @IsNotEmpty()
  eventId: string;

  @IsNotEmpty()
  senderId: string; // User who created the notification

  @IsEnum(NotificationType)
  notificationType: string;

  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsArray()
  recipientAccountIds: string[]; // List of recipients

  @IsOptional()
  scheduledTime?: Date;

  @IsOptional()
  expirationTime?: Date;
}
