import { Module } from '@nestjs/common';
import { NotificationReceiversService } from './notification-receivers.service';
import { NotificationReceiversController } from './notification-receivers.controller';

@Module({
  controllers: [NotificationReceiversController],
  providers: [NotificationReceiversService],
})
export class NotificationReceiversModule {}
