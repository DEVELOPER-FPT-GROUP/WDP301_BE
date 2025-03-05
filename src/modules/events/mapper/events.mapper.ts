import { Event } from '../schema/event.schema';
import { CreateEventDto } from '../dto/request/create-event.dto';
import { UpdateEventDto } from '../dto/request/update-event.dto';
import { EventDTO } from '../dto/response/events.dto';
import { MediaResponseDto } from 'src/modules/media/dto/response/media-response.dto';

export class EventMapper {
  static toEntity(dto: CreateEventDto): Event {
    return {
      eventId: `EVENT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`, // Temporary ID, overridden by hook
      createdBy: dto.createdBy,
      eventScope: dto.eventScope || '',
      eventType: dto.eventType || '',
      eventName: dto.eventName,
      eventDescription: dto.eventDescription || '',
      startDate: dto.startDate || new Date(),
      endDate: dto.endDate || null,
      recurrenceFrequency: dto.recurrenceFrequency || 'none',
      interval: dto.interval || null,
      byDay: dto.byDay || null,
      byMonthDay: dto.byMonthDay || null,
      recurrenceEnd: dto.recurrenceEnd || null,
      location: dto.location || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Event;
  }

  static toUpdateEntity(dto: UpdateEventDto): Partial<Event> {
    const updateData: Partial<Event> = {};

    if (dto.eventName) updateData.eventName = dto.eventName;
    if (dto.eventDescription) updateData.eventDescription = dto.eventDescription;
    if (dto.eventScope !== undefined) updateData.eventScope = dto.eventScope; // Allow explicit empty string
    if (dto.eventType !== undefined) updateData.eventType = dto.eventType;
    if (dto.startDate) updateData.startDate = dto.startDate;
    if (dto.endDate !== undefined) updateData.endDate = dto.endDate; // Allow null
    if (dto.recurrenceFrequency) updateData.recurrenceFrequency = dto.recurrenceFrequency;
    if (dto.interval !== undefined) updateData.interval = dto.interval; // Allow null
    if (dto.byDay !== undefined) updateData.byDay = dto.byDay;
    if (dto.byMonthDay !== undefined) updateData.byMonthDay = dto.byMonthDay;
    if (dto.recurrenceEnd !== undefined) updateData.recurrenceEnd = dto.recurrenceEnd;
    if (dto.location !== undefined) updateData.location = dto.location;
    // if (dto.lunarDate !== undefined) updateData.lunarDate = dto.lunarDate;

    updateData.updatedAt = new Date(); // Always update timestamp

    return updateData;
  }

  static toResponseDto(event: Event, mediaList: MediaResponseDto[] = []): EventDTO {
    return {
      eventId: event.eventId,
      createdBy: event.createdBy,
      eventScope: event.eventScope,
      eventType: event.eventType,
      eventName: event.eventName,
      eventDescription: event.eventDescription,
      startDate: event.startDate,
      endDate: event.endDate,
      recurrenceFrequency: event.recurrenceFrequency,
      interval: event.interval,
      byDay: event.byDay,
      byMonthDay: event.byMonthDay,
      recurrenceEnd: event.recurrenceEnd,
      location: event.location,
      media: mediaList,
    };
  }
}