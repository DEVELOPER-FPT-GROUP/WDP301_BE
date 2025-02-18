import { Module } from '@nestjs/common';
import { EventParticipantsController } from './controller/event-participants.controller';
import { EventParticipantsService } from './service/event-participants.service';


@Module({
  controllers: [EventParticipantsController],
  providers: [EventParticipantsService],
})
export class EventParticipantsModule {}
