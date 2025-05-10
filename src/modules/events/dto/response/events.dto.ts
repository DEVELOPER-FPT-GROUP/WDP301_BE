import { Event } from '../../schema/event.schema';
import { MediaResponseDto } from 'src/modules/media/dto/response/media-response.dto';

export class EventDTO {
  eventId: string;
  createdBy: string;
  eventScope: string;
  eventType: string;
  eventName: string;
  eventDescription: string;
  startDate: Date;
  endDate: Date;
  recurrenceFrequency: string;
  interval: number;
  byDay: string;
  byMonthDay: number;
  recurrenceEnd: Date;
  location: string;
  media: MediaResponseDto[]; // Added media field

  static toResponseDto(event: Event, mediaList: MediaResponseDto[] = []): EventDTO {
    const dto = new EventDTO();
    dto.eventId = event.eventId;
    dto.createdBy = event.createdBy;
    dto.eventScope = event.eventScope;
    dto.eventType = event.eventType;
    dto.eventName = event.eventName;
    dto.eventDescription = event.eventDescription;
    dto.startDate = event.startDate;
    dto.endDate = event.endDate;
    dto.recurrenceFrequency = event.recurrenceFrequency;
    dto.interval = event.interval;
    dto.byDay = event.byDay;
    dto.byMonthDay = event.byMonthDay;
    dto.recurrenceEnd = event.recurrenceEnd;
    dto.location = event.location;
    dto.media = mediaList;
    return dto;
  }
}

export class EventResponse {
  event: EventDTO;
}