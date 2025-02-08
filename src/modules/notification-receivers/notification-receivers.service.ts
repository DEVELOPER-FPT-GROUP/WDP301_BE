import { Injectable } from '@nestjs/common';
import { CreateNotificationReceiverDto } from './dto/create-notification-receiver.dto';
import { UpdateNotificationReceiverDto } from './dto/update-notification-receiver.dto';

@Injectable()
export class NotificationReceiversService {
  create(createNotificationReceiverDto: CreateNotificationReceiverDto) {
    return 'This action adds a new notificationReceiver';
  }

  findAll() {
    return `This action returns all notificationReceivers`;
  }

  findOne(id: number) {
    return `This action returns a #${id} notificationReceiver`;
  }

  update(id: number, updateNotificationReceiverDto: UpdateNotificationReceiverDto) {
    return `This action updates a #${id} notificationReceiver`;
  }

  remove(id: number) {
    return `This action removes a #${id} notificationReceiver`;
  }
}
