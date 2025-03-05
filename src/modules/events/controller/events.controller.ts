import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
} from '@nestjs/common';
import { EventsService } from '../service/events.service';
import { CreateEventDto } from '../dto/request/create-event.dto';
import { UpdateEventDto } from '../dto/request/update-event.dto';
import { LoggingInterceptor } from 'src/common/interceptors/logging.interceptor';


@Controller('events')
@UseInterceptors(LoggingInterceptor)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  create(@Body() createEventDto: CreateEventDto) {
    console.log("[Handler] Create Event called");
    return this.eventsService.createEvent(createEventDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    console.log(`[Handler] Fetch Event: ${id}`);
    return this.eventsService.getEventById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto) {
    console.log(`[Handler] Update Event: ${id}`);
    return this.eventsService.updateEvent(id, updateEventDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    console.log(`[Handler] Delete Event: ${id}`);
    return this.eventsService.deleteEvent(id);
  }
}
