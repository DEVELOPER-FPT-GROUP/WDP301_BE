import { PartialType } from '@nestjs/mapped-types';
import { CreateNotificationReceiverDto } from './create-notification-receiver.dto';

export class UpdateNotificationReceiverDto extends PartialType(CreateNotificationReceiverDto) {}
