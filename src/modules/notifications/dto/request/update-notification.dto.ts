import { IsOptional, IsEnum, IsArray, IsNotEmpty } from 'class-validator';
import { NotificationType } from '../schema/notification.schema';

export class UpdateNotificationDto {
  @IsOptional()
  @IsEnum(NotificationType)
  notificationType?: NotificationType;

  @IsOptional()
  message?: string;

  @IsOptional()
  scheduledTime?: Date;

  @IsOptional()
  expirationTime?: Date;

  @IsArray()
  @IsOptional()
  recipientAccountIds?: string[]; // Optional list to update recipients
}
