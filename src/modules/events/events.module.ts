import { Module } from '@nestjs/common';
import { EventsController } from './controller/events.controller';
import { EventsService } from './service/events.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Event, EventSchema } from './schema/event.schema';
import { EventsRepository } from './repository/events.repository';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [
      MongooseModule.forFeature([{ name: Event.name, schema: EventSchema }]),
      MediaModule
    ],
  controllers: [EventsController],
  providers: [EventsService,EventsRepository],
})
export class EventsModule {}
