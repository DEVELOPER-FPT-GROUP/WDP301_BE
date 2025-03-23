import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationRecipientRepository } from './repository/notification-recipient.repository';
import { Notification, NotificationSchema } from './schema/notification.schema';
import { NotificationRecipient, NotificationRecipientSchema } from './schema/notification-recipient.schema';
import { NotificationsService } from './service/notifications.service';
import { NotificationsController } from './controller/notifications.controller';
import { NotificationsRepository } from './repository/notifications.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: NotificationRecipient.name, schema: NotificationRecipientSchema },
    ]),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsRepository, NotificationRecipientRepository],
  exports: [NotificationsService],
})
export class NotificationModule {}
