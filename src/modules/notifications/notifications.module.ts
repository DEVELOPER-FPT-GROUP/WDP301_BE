import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationService } from './service/notification.service';
import { NotificationController } from './controller/notification.controller';
import { NotificationRepository } from './repository/notification.repository';
import { NotificationRecipientRepository } from './repository/notification-recipient.repository';
import { Notification, NotificationSchema } from './schema/notification.schema';
import { NotificationRecipient, NotificationRecipientSchema } from './schema/notification-recipient.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: NotificationRecipient.name, schema: NotificationRecipientSchema },
    ]),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationRepository, NotificationRecipientRepository],
  exports: [NotificationService],
})
export class NotificationModule {}
