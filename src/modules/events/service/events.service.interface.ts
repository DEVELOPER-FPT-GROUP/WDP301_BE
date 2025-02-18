import { CreateEventDto } from "../dto/request/create-event.dto";
import { UpdateEventDto } from "../dto/request/update-event.dto";
import { EventResponse } from "../dto/response/events.dto";

export interface IEventService {
    getEventById(id: string): Promise<EventResponse>;
    createEvent(data: CreateEventDto): Promise<EventResponse>;
    updateEvent(id: string, updateData: UpdateEventDto): Promise<EventResponse>;
    deleteEvent(id: string): Promise<boolean>;
  }