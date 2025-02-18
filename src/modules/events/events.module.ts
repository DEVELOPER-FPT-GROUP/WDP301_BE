import { Module } from '@nestjs/common';
import { EventsController } from './controller/events.controller';
import { EventsService } from './service/events.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Event, EventSchema } from './schema/event.schema';
import { EventsRepository } from './repository/events.repository';

@Module({
  imports: [
      MongooseModule.forFeature([{ name: Event.name, schema: EventSchema }]),
    ],
  controllers: [EventsController],
  providers: [EventsService,EventsRepository],
})
export class EventsModule {}
