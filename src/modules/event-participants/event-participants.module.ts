import { Module } from '@nestjs/common';
import { EventParticipantsService } from './event-participants.service';
import { EventParticipantsController } from './event-participants.controller';

@Module({
  controllers: [EventParticipantsController],
  providers: [EventParticipantsService],
})
export class EventParticipantsModule {}
